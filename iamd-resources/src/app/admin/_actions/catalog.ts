"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbErrorMessage, withAdmin } from "@/lib/admin";
import {
  chapterSchema,
  formDataToObject,
  levelSchema,
  programSchema,
  semesterSchema,
  subjectSchema,
  zodErrors,
  type ActionState,
} from "@/lib/validation";

const idSchema = z.uuid();

function invalid(error: z.ZodError): ActionState {
  return { ok: false, errors: zodErrors(error), message: "Vérifiez les champs indiqués." };
}

function refreshCatalog() {
  revalidatePath("/", "layout");
}

// --- Formations / niveaux / semestres -------------------------------------------------

export async function saveProgram(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return withAdmin(async (supabase) => {
    const parsed = programSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return invalid(parsed.error);
    const id = formData.get("id")?.toString();
    const { error } = id
      ? await supabase.from("programs").update(parsed.data).eq("id", idSchema.parse(id))
      : await supabase.from("programs").insert(parsed.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    refreshCatalog();
    return { ok: true, message: id ? "Formation mise à jour." : "Formation créée." };
  });
}

export async function saveLevel(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return withAdmin(async (supabase) => {
    const parsed = levelSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return invalid(parsed.error);
    const id = formData.get("id")?.toString();
    const { error } = id
      ? await supabase.from("levels").update(parsed.data).eq("id", idSchema.parse(id))
      : await supabase.from("levels").insert(parsed.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    refreshCatalog();
    return { ok: true, message: id ? "Niveau mis à jour." : "Niveau ajouté." };
  });
}

export async function saveSemester(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return withAdmin(async (supabase) => {
    const parsed = semesterSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return invalid(parsed.error);
    const id = formData.get("id")?.toString();
    const { error } = id
      ? await supabase.from("semesters").update(parsed.data).eq("id", idSchema.parse(id))
      : await supabase.from("semesters").insert(parsed.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    refreshCatalog();
    return { ok: true, message: id ? "Semestre mis à jour." : "Semestre ajouté." };
  });
}

const deletable = { programs: "Formation", levels: "Niveau", semesters: "Semestre", chapters: "Chapitre" } as const;

export async function deleteCatalogItem(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return withAdmin(async (supabase) => {
    const table = z.enum(["programs", "levels", "semesters", "chapters"]).safeParse(formData.get("table"));
    const id = idSchema.safeParse(formData.get("id"));
    if (!table.success || !id.success) return { ok: false, message: "Requête invalide." };
    const { error } = await supabase.from(table.data).delete().eq("id", id.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    refreshCatalog();
    return { ok: true, message: `${deletable[table.data]} supprimé.` };
  });
}

// --- Matières -----------------------------------------------------------------------

export async function saveSubject(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = formData.get("id")?.toString();
  const created: { id: string | null } = { id: null };
  const result = await withAdmin(async (supabase) => {
    const parsed = subjectSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return invalid(parsed.error);
    if (id) {
      const { error } = await supabase.from("subjects").update(parsed.data).eq("id", idSchema.parse(id));
      if (error) return { ok: false, message: dbErrorMessage(error) };
    } else {
      const { data, error } = await supabase.from("subjects").insert(parsed.data).select("id").single();
      if (error) return { ok: false, message: dbErrorMessage(error) };
      created.id = data.id;
    }
    refreshCatalog();
    return { ok: true, message: id ? "Matière mise à jour." : "Matière créée." };
  });
  if (created.id) redirect(`/admin/matieres/${created.id}?cree=1`);
  return result;
}

export async function deleteSubject(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const result = await withAdmin(async (supabase) => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, message: "Requête invalide." };
    const { count } = await supabase.from("resources").select("id", { count: "exact", head: true }).eq("subject_id", id.data);
    if (count) {
      return {
        ok: false,
        message: `Cette matière contient ${count} ressource(s). Supprimez-les ou déplacez-les avant de supprimer la matière, ou dépubliez simplement la matière.`,
      };
    }
    const { error } = await supabase.from("subjects").delete().eq("id", id.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    refreshCatalog();
    return { ok: true, message: "Matière supprimée." };
  });
  if (result.ok) redirect("/admin/matieres?supprime=1");
  return result;
}

// --- Chapitres ----------------------------------------------------------------------

export async function saveChapter(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return withAdmin(async (supabase) => {
    const parsed = chapterSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return invalid(parsed.error);
    const id = formData.get("id")?.toString();
    const { error } = id
      ? await supabase.from("chapters").update(parsed.data).eq("id", idSchema.parse(id))
      : await supabase.from("chapters").insert(parsed.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    refreshCatalog();
    return { ok: true, message: id ? "Chapitre mis à jour." : "Chapitre ajouté." };
  });
}
