import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { assertAdmin, AuthorizationError, type CurrentUser } from "@/lib/auth";
import { STORAGE_BUCKET } from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import { checkFileContent, checkFileMeta, getExtension } from "@/lib/files";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation";

export type DB = SupabaseClient<Database>;

/** Traduit une erreur PostgreSQL / PostgREST en message compréhensible. */
export function dbErrorMessage(error: Pick<PostgrestError, "code" | "message">): string {
  switch (error.code) {
    case "23505":
      return "Cet identifiant (ou ce nom) est déjà utilisé. Choisissez-en un autre.";
    case "23503":
      return "Impossible : cet élément est encore utilisé par d'autres données (matières, ressources…).";
    case "23514":
      return error.message.includes("check constraint") ? "Certaines valeurs ne respectent pas les règles attendues." : error.message;
    case "42501":
      return "Action non autorisée.";
    case "PGRST116":
      return "Élément introuvable.";
    default:
      return "L'opération a échoué. Réessayez ou contactez le responsable technique.";
  }
}

/**
 * Exécute une opération d'administration après vérification du rôle côté serveur.
 * Ne pas appeler redirect() à l'intérieur : le faire après, sur le résultat.
 */
export async function withAdmin(fn: (supabase: DB, user: CurrentUser) => Promise<ActionState>): Promise<ActionState> {
  let user: CurrentUser;
  try {
    user = await assertAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
  const supabase = await createClient();
  try {
    return await fn(supabase, user);
  } catch (error) {
    console.error("[admin]", error);
    return { ok: false, message: "Une erreur inattendue est survenue." };
  }
}

/**
 * Vérifie un fichier déjà téléversé dans le stockage : taille réelle, type et
 * signature binaire. Le fichier est supprimé s'il est refusé.
 */
export async function verifyStoredFile(
  supabase: DB,
  path: string,
  declaredName: string,
): Promise<{ ok: true; size: number; mime: string } | { ok: false; error: string }> {
  const extension = getExtension(path);
  const reject = async (message: string) => {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return { ok: false as const, error: message };
  };

  if (extension !== getExtension(declaredName)) return reject("Extension de fichier incohérente.");

  const { data: info, error } = await supabase.storage.from(STORAGE_BUCKET).info(path);
  if (error || !info) return { ok: false, error: "Fichier introuvable dans le stockage. Recommencez le téléversement." };

  const size = Number(info.size ?? 0);
  const meta = checkFileMeta(declaredName, size);
  if (!meta.ok) return reject(meta.error);

  const { data: signed } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60);
  if (!signed) return reject("Impossible de vérifier le contenu du fichier.");
  const response = await fetch(signed.signedUrl, { headers: { Range: "bytes=0-4095" }, cache: "no-store" });
  if (!response.ok) return reject("Impossible de vérifier le contenu du fichier.");
  const head = new Uint8Array(await response.arrayBuffer()).slice(0, 4096);

  const content = checkFileContent(extension, head);
  if (!content.ok) return reject(content.error);

  return { ok: true, size, mime: meta.rule.mime };
}
