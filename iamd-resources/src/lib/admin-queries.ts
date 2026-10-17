import "server-only";
import { createClient } from "@/lib/supabase/server";

// Lectures réservées à l'administration (les règles RLS donnent aux administrateurs
// l'accès aux brouillons). Chaque page appelle requireAdminPage() au préalable.

export async function getAdminOverview(days = 30) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_overview", { p_days: days });
  if (error) throw new Error(error.message);
  return data as {
    subjects: number;
    resources_published: number;
    resources_draft: number;
    projects: number;
    users: number;
    views: number;
    downloads: number;
    top_resources: { id: string; title: string; type: string; views: number; downloads: number }[];
    daily: { day: string; views: number; downloads: number }[];
  };
}

export async function getSubjectOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, chapters ( id, title, position )")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  for (const subject of data) subject.chapters.sort((a, b) => a.position - b.position);
  return data;
}

export async function getProjectOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("id, title").order("title");
  if (error) throw new Error(error.message);
  return data;
}

export async function getLevelOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("levels")
    .select("id, name, sort_order, program:programs ( name, short_name ), semesters ( id, name, sort_order )")
    .order("sort_order");
  if (error) throw new Error(error.message);
  for (const level of data) level.semesters.sort((a, b) => a.sort_order - b.sort_order);
  return data;
}

export async function getAdminSubject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("*, chapters ( id, title, description, position )")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  data?.chapters.sort((a, b) => a.position - b.position);
  return data;
}

export async function getAdminResources(filters: { status?: "published" | "draft"; subjectId?: string; projectId?: string; q?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("id, title, type, is_published, created_at, file_name, file_size, external_url, source, subject:subjects ( id, name ), project:projects ( id, title )")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status) query = query.eq("is_published", filters.status === "published");
  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.q) query = query.ilike("title", `%${filters.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminResource(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, title, category, is_published, is_example, created_at, subject:subjects ( name ), resources ( count )")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminProject(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminSubjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subjects")
    .select("id, slug, name, is_published, sort_order, level:levels ( name ), semester:semesters ( name ), resources ( count ), chapters ( count )")
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminTaxonomy() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*, levels ( id, name, sort_order, semesters ( id, name, sort_order ) )")
    .order("sort_order");
  if (error) throw new Error(error.message);
  for (const program of data) {
    program.levels.sort((a, b) => a.sort_order - b.sort_order);
    for (const level of program.levels) level.semesters.sort((a, b) => a.sort_order - b.sort_order);
  }
  return data;
}

export async function getUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, email, full_name, role, created_at").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
