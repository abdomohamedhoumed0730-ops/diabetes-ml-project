import "server-only";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import type { SearchInput } from "@/lib/validation";

// Toutes les lectures passent par le client lié à la session : les règles RLS
// déterminent ce que chaque visiteur peut voir (publié / brouillon / admin).

export const RESOURCE_SELECT = `
  id, title, description, type, file_path, file_name, file_size, mime_type, external_url,
  source, author, license, keywords, is_published, created_at, updated_at,
  subject:subjects ( id, name, slug ),
  chapter:chapters ( id, title, position ),
  project:projects ( id, title, slug )
` as const;

async function db() {
  return createClient();
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context} : ${error?.message ?? "erreur inconnue"}`);
}

// --- Catalogue -----------------------------------------------------------------

export async function getPrograms() {
  const supabase = await db();
  const { data, error } = await supabase
    .from("programs")
    .select("id, slug, name, short_name, description, institution, is_published, levels ( id, name, sort_order )")
    .order("sort_order")
    .order("name");
  if (error) fail("Chargement des formations", error);
  return data;
}

export async function getProgramTree(slug: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("programs")
    .select(
      `id, slug, name, short_name, description, institution,
       levels ( id, name, sort_order,
         semesters ( id, name, sort_order ),
         subjects ( id, slug, name, short_description, icon, sort_order, semester_id, is_published, resources ( count ) )
       )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("Chargement de la formation", error);
  if (!data) return null;
  data.levels.sort((a, b) => a.sort_order - b.sort_order);
  for (const level of data.levels) {
    level.semesters.sort((a, b) => a.sort_order - b.sort_order);
    level.subjects.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "fr"));
  }
  return data;
}

export async function getSubjects(options: { levelId?: string } = {}) {
  const supabase = await db();
  let query = supabase
    .from("subjects")
    .select(
      `id, slug, name, short_description, icon, sort_order, is_published, level_id, semester_id,
       level:levels ( id, name, sort_order, program:programs ( id, name, short_name, slug ) ),
       semester:semesters ( id, name ),
       resources ( count )`,
    )
    .order("sort_order")
    .order("name");
  if (options.levelId) query = query.eq("level_id", options.levelId);
  const { data, error } = await query;
  if (error) fail("Chargement des matières", error);
  return data;
}

export async function getLevels() {
  const supabase = await db();
  const { data, error } = await supabase
    .from("levels")
    .select("id, name, sort_order, program:programs ( id, name, short_name ), semesters ( id, name, sort_order )")
    .order("sort_order");
  if (error) fail("Chargement des niveaux", error);
  return data;
}

export async function getSubjectBySlug(slug: string) {
  const supabase = await db();
  const { data: subject, error } = await supabase
    .from("subjects")
    .select(
      `id, slug, name, short_description, presentation, objectives, icon, is_published, created_at, updated_at,
       level:levels ( id, name, program:programs ( id, name, short_name, slug ) ),
       semester:semesters ( id, name ),
       chapters ( id, title, description, position )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("Chargement de la matière", error);
  if (!subject) return null;
  subject.chapters.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, "fr"));

  const [resources, projects] = await Promise.all([
    supabase.from("resources").select(RESOURCE_SELECT).eq("subject_id", subject.id).order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, slug, title, summary, category, difficulty, technologies, is_example, is_published, created_at")
      .eq("subject_id", subject.id)
      .order("created_at", { ascending: false }),
  ]);
  if (resources.error) fail("Chargement des ressources", resources.error);
  if (projects.error) fail("Chargement des projets", projects.error);

  return { subject, resources: resources.data, projects: projects.data };
}

// --- Ressources ----------------------------------------------------------------

export type ResourceListItem = Awaited<ReturnType<typeof getLatestResources>>[number];

export async function getLatestResources(limit = 6) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .eq("is_published", true)
    .neq("type", "capture")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("Chargement des dernières ressources", error);
  return data;
}

export async function getPopularResources(limit = 6) {
  const supabase = await db();
  const { data: stats, error } = await supabase.rpc("popular_resources", { p_limit: limit });
  if (error) fail("Chargement des ressources populaires", error);
  if (!stats.length) return [];

  const { data, error: listError } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .in(
      "id",
      stats.map((row) => row.resource_id),
    );
  if (listError) fail("Chargement des ressources populaires", listError);

  const byId = new Map(data.map((row) => [row.id, row]));
  return stats.flatMap((row) => {
    const resource = byId.get(row.resource_id);
    return resource ? [{ ...resource, views: Number(row.views), downloads: Number(row.downloads) }] : [];
  });
}

export async function getResource(id: string) {
  const supabase = await db();
  const { data, error } = await supabase.from("resources").select(RESOURCE_SELECT).eq("id", id).maybeSingle();
  if (error) fail("Chargement du document", error);
  return data;
}

/** URL signée temporaire ; le stockage vérifie que le fichier est visible pour l'appelant. */
export async function getSignedFileUrl(path: string, options: { download?: string; expiresIn?: number } = {}) {
  const supabase = await db();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, options.expiresIn ?? 600, options.download ? { download: options.download } : undefined);
  if (error) return null;
  return data.signedUrl;
}

export async function logEvent(kind: Database["public"]["Enums"]["event_kind"], target: { resourceId?: string; projectId?: string }) {
  const supabase = await db();
  // Les statistiques ne doivent jamais bloquer l'affichage.
  await supabase.rpc("log_event", {
    p_kind: kind,
    p_resource_id: target.resourceId,
    p_project_id: target.projectId,
  });
}

// --- Projets -------------------------------------------------------------------

export async function getProjects(options: { category?: Database["public"]["Enums"]["project_category"]; limit?: number } = {}) {
  const supabase = await db();
  let query = supabase
    .from("projects")
    .select(
      "id, slug, title, summary, category, difficulty, technologies, is_example, is_published, created_at, subject:subjects ( id, name, slug )",
    )
    .order("is_example")
    .order("created_at", { ascending: false });
  if (options.category) query = query.eq("category", options.category);
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) fail("Chargement des projets", error);
  return data;
}

export type ProjectListItem = Awaited<ReturnType<typeof getProjects>>[number];

export async function getProjectBySlug(slug: string) {
  const supabase = await db();
  const { data: project, error } = await supabase
    .from("projects")
    .select("*, subject:subjects ( id, name, slug )")
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("Chargement du projet", error);
  if (!project) return null;

  const { data: resources, error: resError } = await supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });
  if (resError) fail("Chargement des fichiers du projet", resError);
  return { project, resources };
}

// --- Recherche -----------------------------------------------------------------

export const SEARCH_PAGE_SIZE = 20;

export async function searchCatalog(input: SearchInput) {
  const supabase = await db();
  const page = input.page ?? 1;
  const { data, error } = await supabase.rpc("search_catalog", {
    p_query: input.q,
    p_kind: input.kind,
    p_level_id: input.level,
    p_subject_id: input.subject,
    p_type: input.type,
    p_chapter_id: input.chapter,
    p_category: input.category,
    p_limit: SEARCH_PAGE_SIZE,
    p_offset: (page - 1) * SEARCH_PAGE_SIZE,
  });
  if (error) fail("Recherche", error);
  return { results: data, total: data.length ? Number(data[0].total_count) : 0, page };
}

export async function getChaptersForSubject(subjectId: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("chapters")
    .select("id, title, position")
    .eq("subject_id", subjectId)
    .order("position");
  if (error) fail("Chargement des chapitres", error);
  return data;
}

// --- Espace personnel ------------------------------------------------------------

export async function getFavorites(userId: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("favorites")
    .select(`id, created_at, resource:resources ( ${RESOURCE_SELECT} ), project:projects ( id, slug, title, summary, category, difficulty, technologies, is_example, is_published, created_at, subject:subjects ( id, name, slug ) )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) fail("Chargement des favoris", error);
  return data;
}

export async function getHistory(userId: string, limit = 30) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("resource_events")
    .select(`id, kind, created_at, resource:resources ( id, title, type, subject:subjects ( name, slug ) ), project:projects ( id, title, slug )`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) fail("Chargement de l'historique", error);

  // Une seule entrée par élément, la plus récente.
  const seen = new Set<string>();
  const items = [];
  for (const event of data) {
    const key = event.resource?.id ?? event.project?.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(event);
    if (items.length >= limit) break;
  }
  return items;
}

export async function getFavoriteState(userId: string | undefined, target: { resourceId?: string; projectId?: string }) {
  if (!userId) return false;
  const supabase = await db();
  let query = supabase.from("favorites").select("id").eq("user_id", userId);
  query = target.resourceId ? query.eq("resource_id", target.resourceId) : query.eq("project_id", target.projectId!);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}
