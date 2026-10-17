"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbErrorMessage, withAdmin } from "@/lib/admin";
import { STORAGE_BUCKET } from "@/lib/constants";
import { formDataToObject, projectSchema, zodErrors, type ActionState } from "@/lib/validation";

const idSchema = z.uuid();

export async function saveProject(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = formData.get("id")?.toString() || null;
  const created: { id: string | null } = { id: null };
  const result = await withAdmin(async (supabase) => {
    const parsed = projectSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Vérifiez les champs indiqués." };
    if (id) {
      const { error } = await supabase.from("projects").update(parsed.data).eq("id", idSchema.parse(id));
      if (error) return { ok: false, message: dbErrorMessage(error) };
    } else {
      const { data, error } = await supabase.from("projects").insert(parsed.data).select("id").single();
      if (error) return { ok: false, message: dbErrorMessage(error) };
      created.id = data.id;
    }
    revalidatePath("/", "layout");
    return { ok: true, message: id ? "Projet mis à jour." : "Projet créé." };
  });
  if (created.id) redirect(`/admin/projets/${created.id}?cree=1`);
  return result;
}

export async function deleteProject(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const result = await withAdmin(async (supabase) => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, message: "Requête invalide." };
    // Les ressources du projet sont supprimées en cascade : on retire aussi leurs fichiers.
    const { data: files } = await supabase.from("resources").select("file_path").eq("project_id", id.data).not("file_path", "is", null);
    const { error } = await supabase.from("projects").delete().eq("id", id.data);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    const paths = (files ?? []).map((file) => file.file_path).filter((path): path is string => Boolean(path));
    if (paths.length) await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    revalidatePath("/", "layout");
    return { ok: true, message: "Projet supprimé." };
  });
  if (result.ok) redirect("/admin/projets?supprime=1");
  return result;
}

export async function setProjectPublished(formData: FormData): Promise<void> {
  await withAdmin(async (supabase) => {
    const id = idSchema.parse(formData.get("id"));
    const { error } = await supabase.from("projects").update({ is_published: formData.get("published") === "true" }).eq("id", id);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    revalidatePath("/", "layout");
    return { ok: true };
  });
}
