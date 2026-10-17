"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dbErrorMessage, verifyStoredFile, withAdmin } from "@/lib/admin";
import { assertAdmin, AuthorizationError } from "@/lib/auth";
import { STORAGE_BUCKET } from "@/lib/constants";
import { checkFileMeta, sanitizeFileName } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";
import {
  formDataToObject,
  resourceSchema,
  storagePathSchema,
  uploadRequestSchema,
  zodErrors,
  type ActionState,
} from "@/lib/validation";

const idSchema = z.uuid();

export type UploadTicket = { ok: true; path: string; token: string; contentType: string } | { ok: false; message: string };

/**
 * Étape 1 du téléversement : contrôle du nom, du format et de la taille, puis
 * création d'une URL de dépôt signée. Le navigateur envoie ensuite le fichier
 * directement au stockage (pas de limite de taille de requête côté serveur).
 */
export async function prepareUpload(input: { fileName: string; size: number }): Promise<UploadTicket> {
  try {
    await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Fichier invalide." };
  const meta = checkFileMeta(parsed.data.fileName, parsed.data.size);
  if (!meta.ok) return { ok: false, message: meta.error };

  const now = new Date();
  const path = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}/${sanitizeFileName(parsed.data.fileName)}`;
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, message: "Le stockage a refusé le téléversement." };
  return { ok: true, path: data.path, token: data.token, contentType: meta.rule.mime };
}

/** Étape 2 : enregistrement des métadonnées (création ou modification). */
export async function saveResource(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const id = formData.get("id")?.toString() || null;
  const uploadedPath = formData.get("file_path")?.toString() || null;
  const uploadedName = formData.get("file_name")?.toString() || null;
  const after: { redirectTo: string | null } = { redirectTo: null };

  const result = await withAdmin(async (supabase) => {
    const cleanup = async () => {
      if (uploadedPath && storagePathSchema.safeParse(uploadedPath).success) {
        await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
      }
    };

    const parsed = resourceSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      await cleanup();
      return { ok: false, errors: zodErrors(parsed.error), message: "Vérifiez les champs indiqués. Le fichier devra être sélectionné à nouveau." };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- confirmation exigée, non stockée
    const { rights_confirmed, external_url, ...fields } = parsed.data;

    // Fichier : nouveau téléversement, fichier existant conservé, ou lien externe.
    let fileFields: { file_path: string | null; file_name: string | null; file_size: number | null; mime_type: string | null; external_url: string | null } | null = null;
    if (uploadedPath) {
      if (!storagePathSchema.safeParse(uploadedPath).success || !uploadedName) {
        return { ok: false, message: "Fichier téléversé invalide." };
      }
      const verified = await verifyStoredFile(supabase, uploadedPath, uploadedName);
      if (!verified.ok) return { ok: false, message: verified.error };
      fileFields = {
        file_path: uploadedPath,
        file_name: uploadedName.slice(0, 255),
        file_size: verified.size,
        mime_type: verified.mime,
        external_url: null,
      };
    } else if (external_url) {
      fileFields = { file_path: null, file_name: null, file_size: null, mime_type: null, external_url };
    }

    if (id) {
      const resourceId = idSchema.parse(id);
      const { data: current, error: currentError } = await supabase.from("resources").select("file_path").eq("id", resourceId).single();
      if (currentError) {
        await cleanup();
        return { ok: false, message: dbErrorMessage(currentError) };
      }
      if (!fileFields && !current.file_path) {
        return { ok: false, message: "Ajoutez un fichier ou un lien externe.", errors: { file: "Fichier ou lien requis." } };
      }
      const { error } = await supabase.from("resources").update({ ...fields, ...(fileFields ?? {}) }).eq("id", resourceId);
      if (error) {
        await cleanup();
        return { ok: false, message: dbErrorMessage(error) };
      }
      // L'ancien fichier est supprimé une fois le nouveau enregistré.
      if (fileFields && current.file_path && current.file_path !== fileFields.file_path) {
        await supabase.storage.from(STORAGE_BUCKET).remove([current.file_path]);
      }
      revalidatePath("/", "layout");
      return { ok: true, message: "Ressource mise à jour." };
    }

    if (!fileFields) {
      return { ok: false, message: "Ajoutez un fichier ou un lien externe.", errors: { file: "Fichier ou lien requis." } };
    }
    const { error } = await supabase.from("resources").insert({ ...fields, ...fileFields });
    if (error) {
      await cleanup();
      return { ok: false, message: dbErrorMessage(error) };
    }
    revalidatePath("/", "layout");
    after.redirectTo = "/admin/ressources?cree=1";
    return { ok: true, message: "Ressource enregistrée." };
  });

  if (after.redirectTo) redirect(after.redirectTo);
  return result;
}

export async function setResourcePublished(formData: FormData): Promise<void> {
  await withAdmin(async (supabase) => {
    const id = idSchema.parse(formData.get("id"));
    const published = formData.get("published") === "true";
    const { error } = await supabase.from("resources").update({ is_published: published }).eq("id", id);
    if (error) return { ok: false, message: dbErrorMessage(error) };
    revalidatePath("/", "layout");
    return { ok: true };
  });
}

export async function deleteResource(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const result = await withAdmin(async (supabase) => {
    const id = idSchema.safeParse(formData.get("id"));
    if (!id.success) return { ok: false, message: "Requête invalide." };
    const { data, error } = await supabase.from("resources").delete().eq("id", id.data).select("file_path").maybeSingle();
    if (error) return { ok: false, message: dbErrorMessage(error) };
    if (!data) return { ok: false, message: "Ressource introuvable." };
    if (data.file_path) await supabase.storage.from(STORAGE_BUCKET).remove([data.file_path]);
    revalidatePath("/", "layout");
    return { ok: true, message: "Ressource supprimée." };
  });
  if (result.ok) redirect("/admin/ressources?supprime=1");
  return result;
}

/** Supprime un fichier téléversé mais non enregistré (formulaire abandonné). */
export async function discardUpload(path: string): Promise<void> {
  await withAdmin(async (supabase) => {
    if (!storagePathSchema.safeParse(path).success) return { ok: false };
    const { count } = await supabase.from("resources").select("id", { count: "exact", head: true }).eq("file_path", path);
    if (!count) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return { ok: true };
  });
}
