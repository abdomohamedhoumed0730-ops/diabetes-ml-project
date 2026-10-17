import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type Profile = Tables<"profiles">;
export type CurrentUser = { id: string; email: string | null; profile: Profile | null };

/** Utilisateur connecté (vérifié auprès du serveur d'authentification), ou null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? null, profile };
});

export async function requireUser(next = "/espace"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return user;
}

/** Garde serveur pour les pages d'administration. */
export async function requireAdminPage(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.profile?.role !== "admin") redirect("/?erreur=acces-refuse");
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "Action réservée aux administrateurs.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Garde serveur pour les actions d'administration. Les règles RLS de la base
 * appliquent la même restriction : cette vérification fournit un message clair
 * et évite tout traitement inutile.
 */
export async function assertAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "admin") throw new AuthorizationError();
  return user;
}

export { safeNextPath } from "@/lib/paths";
