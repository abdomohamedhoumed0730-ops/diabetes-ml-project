/**
 * Tests d'intégration sur une instance Supabase locale (`npx supabase start`).
 * Ils vérifient que les règles d'accès sont appliquées PAR LA BASE DE DONNÉES,
 * indépendamment de l'interface.
 *
 * Lancement : npm run test:integration
 */
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
const secretKey = (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!;

type Client = SupabaseClient<Database>;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service: Client = createClient<Database>(url, secretKey, options);
const anon: Client = createClient<Database>(url, anonKey, options);

const run = randomUUID().slice(0, 8);
const password = "MotDePasse123";
const createdUsers: string[] = [];
const createdPaths: string[] = [];
let admin: Client;
let student: Client;
let studentId: string;
let adminId: string;
let subjectId: string;

async function signedInClient(email: string): Promise<{ client: Client; id: string }> {
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  createdUsers.push(data.user.id);
  const client = createClient<Database>(url, anonKey, options);
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { client, id: data.user.id };
}

beforeAll(async () => {
  if (!url || !anonKey || !secretKey) throw new Error("Variables Supabase manquantes : lancez avec --env-file=.env.local");
  ({ client: student, id: studentId } = await signedInClient(`etudiant-${run}@test.local`));
  const adminUser = await signedInClient(`admin-${run}@test.local`);
  adminId = adminUser.id;
  await service.from("profiles").update({ role: "admin" }).eq("id", adminId);
  admin = adminUser.client;

  const { data } = await service.from("subjects").select("id").eq("slug", "machine-learning").single();
  subjectId = data!.id;
});

afterAll(async () => {
  await service.from("resources").delete().like("title", `%${run}%`);
  if (createdPaths.length) await service.storage.from("documents").remove(createdPaths);
  await service.from("subjects").delete().like("slug", `%${run}%`);
  for (const id of createdUsers) await service.auth.admin.deleteUser(id);
});

describe("visiteur anonyme", () => {
  it("lit le catalogue publié", async () => {
    const { data, error } = await anon.from("subjects").select("slug");
    expect(error).toBeNull();
    expect(data!.map((row) => row.slug)).toContain("machine-learning");
  });

  it("ne peut rien écrire", async () => {
    const insert = await anon.from("subjects").insert({ name: "Pirate", slug: `pirate-${run}`, level_id: randomUUID() });
    expect(insert.error).not.toBeNull();
    const update = await anon.from("subjects").update({ name: "Pirate" }).eq("id", subjectId).select();
    expect(update.data ?? []).toHaveLength(0);
  });

  it("ne voit pas les profils ni les statistiques détaillées", async () => {
    const profiles = await anon.from("profiles").select("*");
    expect(profiles.data ?? []).toHaveLength(0);
    const events = await anon.from("resource_events").select("*");
    expect(events.data ?? []).toHaveLength(0);
    const overview = await anon.rpc("admin_overview", { p_days: 30 });
    expect(overview.error).not.toBeNull();
  });

  it("ne peut pas insérer directement des statistiques", async () => {
    const { error } = await anon.from("resource_events").insert({ kind: "download", resource_id: randomUUID() });
    expect(error).not.toBeNull();
  });

  it("ne peut pas téléverser de fichier", async () => {
    const { error } = await anon.storage.from("documents").upload(`2026/01/${randomUUID()}/x.pdf`, new Blob(["%PDF-1.4"], { type: "application/pdf" }), { contentType: "application/pdf" });
    expect(error).not.toBeNull();
  });
});

describe("étudiant connecté", () => {
  it("ne peut pas s'attribuer le rôle administrateur", async () => {
    const direct = await student.from("profiles").update({ role: "admin" }).eq("id", studentId);
    expect(direct.error).not.toBeNull();
    const rpc = await student.rpc("set_user_role", { p_user_id: studentId, p_role: "admin" });
    expect(rpc.error).not.toBeNull();
    const { data } = await service.from("profiles").select("role").eq("id", studentId).single();
    expect(data!.role).toBe("student");
  });

  it("peut modifier son nom", async () => {
    const { error } = await student.from("profiles").update({ full_name: "Étudiant Test" }).eq("id", studentId);
    expect(error).toBeNull();
  });

  it("ne voit que son propre profil", async () => {
    const { data } = await student.from("profiles").select("id");
    expect(data!.map((row) => row.id)).toEqual([studentId]);
  });

  it("ne peut pas créer de matière ni téléverser", async () => {
    const insert = await student.from("subjects").insert({ name: "Pirate", slug: `pirate-${run}`, level_id: randomUUID() });
    expect(insert.error).not.toBeNull();
    const upload = await student.storage.from("documents").upload(`2026/01/${randomUUID()}/x.pdf`, new Blob(["%PDF-1.4"], { type: "application/pdf" }), { contentType: "application/pdf" });
    expect(upload.error).not.toBeNull();
  });
});

describe("administrateur et cycle de publication", () => {
  let resourceId: string;
  let path: string;

  it("téléverse un fichier et crée une ressource en brouillon", async () => {
    path = `2026/10/${randomUUID()}/cours-${run}.pdf`;
    createdPaths.push(path);
    const { data: ticket, error: ticketError } = await admin.storage.from("documents").createSignedUploadUrl(path);
    expect(ticketError).toBeNull();
    const upload = await anon.storage
      .from("documents")
      .uploadToSignedUrl(path, ticket!.token, new Blob(["%PDF-1.4\n% test\n"], { type: "application/pdf" }), { contentType: "application/pdf" });
    expect(upload.error).toBeNull();

    const { data, error } = await admin
      .from("resources")
      .insert({
        title: `Support ${run}`,
        type: "cours",
        subject_id: subjectId,
        file_path: path,
        file_name: "cours.pdf",
        file_size: 17,
        mime_type: "application/pdf",
        source: "Test automatisé",
        keywords: ["gradient", `motcle${run}`],
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    resourceId = data!.id;
  });

  it("refuse un type MIME non autorisé par le stockage", async () => {
    const badPath = `2026/10/${randomUUID()}/page.html`;
    const { data: ticket } = await admin.storage.from("documents").createSignedUploadUrl(badPath);
    const upload = await admin.storage.from("documents").uploadToSignedUrl(badPath, ticket!.token, new Blob(["<script>"], { type: "text/html" }), { contentType: "text/html" });
    expect(upload.error).not.toBeNull();
  });

  it("un brouillon est invisible pour le public (base et stockage)", async () => {
    const { data } = await anon.from("resources").select("id").eq("id", resourceId);
    expect(data).toHaveLength(0);
    const signed = await anon.storage.from("documents").createSignedUrl(path, 60);
    expect(signed.error).not.toBeNull();
    const search = await anon.rpc("search_catalog", { p_query: `motcle${run}` });
    expect(search.data).toHaveLength(0);
  });

  it("une fois publiée, la ressource est visible, recherchable et téléchargeable", async () => {
    const { error } = await admin.from("resources").update({ is_published: true }).eq("id", resourceId);
    expect(error).toBeNull();

    const { data } = await anon.from("resources").select("id").eq("id", resourceId);
    expect(data).toHaveLength(1);

    const search = await anon.rpc("search_catalog", { p_query: `MOTCLE${run}` });
    expect(search.data!.map((row) => row.id)).toContain(resourceId);
    const prefix = await anon.rpc("search_catalog", { p_query: "gradi", p_type: "cours", p_subject_id: subjectId });
    expect(prefix.data!.map((row) => row.id)).toContain(resourceId);
    const wrongType = await anon.rpc("search_catalog", { p_query: `motcle${run}`, p_type: "examen" });
    expect(wrongType.data).toHaveLength(0);

    const signed = await anon.storage.from("documents").createSignedUrl(path, 60);
    expect(signed.error).toBeNull();
    const response = await fetch(signed.data!.signedUrl);
    expect(response.status).toBe(200);
    expect((await response.text()).startsWith("%PDF")).toBe(true);
  });

  it("enregistre les statistiques via log_event uniquement", async () => {
    expect((await anon.rpc("log_event", { p_kind: "view", p_resource_id: resourceId })).error).toBeNull();
    expect((await student.rpc("log_event", { p_kind: "download", p_resource_id: resourceId })).error).toBeNull();

    const history = await student.from("resource_events").select("kind, user_id").eq("resource_id", resourceId);
    expect(history.data).toEqual([{ kind: "download", user_id: studentId }]);

    const overview = await admin.rpc("admin_overview", { p_days: 30 });
    expect(overview.error).toBeNull();
    const popular = await anon.rpc("popular_resources", { p_limit: 50 });
    expect(popular.data!.find((row) => row.resource_id === resourceId)).toMatchObject({ views: 1, downloads: 1 });
  });

  it("les favoris sont personnels", async () => {
    const own = await student.from("favorites").insert({ user_id: studentId, resource_id: resourceId });
    expect(own.error).toBeNull();
    const forged = await student.from("favorites").insert({ user_id: adminId, resource_id: resourceId });
    expect(forged.error).not.toBeNull();
    const adminFavs = await admin.from("favorites").select("id").eq("user_id", adminId);
    expect(adminFavs.data).toHaveLength(0);
  });

  it("le dernier administrateur ne peut pas être rétrogradé", async () => {
    const admins = await service.from("profiles").select("id").eq("role", "admin");
    if (admins.data!.length === 1) {
      const { error } = await admin.rpc("set_user_role", { p_user_id: adminId, p_role: "student" });
      expect(error).not.toBeNull();
    } else {
      // Plusieurs administrateurs existent : la promotion/rétrogradation d'un étudiant fonctionne.
      expect((await admin.rpc("set_user_role", { p_user_id: studentId, p_role: "admin" })).error).toBeNull();
      expect((await admin.rpc("set_user_role", { p_user_id: studentId, p_role: "student" })).error).toBeNull();
    }
  });

  it("une matière dépubliée masque aussi ses ressources", async () => {
    await admin.from("subjects").update({ is_published: false }).eq("id", subjectId);
    try {
      const { data } = await anon.from("resources").select("id").eq("id", resourceId);
      expect(data).toHaveLength(0);
      const subject = await anon.from("subjects").select("id").eq("id", subjectId);
      expect(subject.data).toHaveLength(0);
    } finally {
      await admin.from("subjects").update({ is_published: true }).eq("id", subjectId);
    }
  });
});
