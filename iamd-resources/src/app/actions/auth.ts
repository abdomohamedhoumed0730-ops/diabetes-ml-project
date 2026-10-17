"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";
import { env } from "@/lib/env";
import { formDataToObject, signInSchema, signUpSchema, zodErrors, type ActionState } from "@/lib/validation";

export async function signIn(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = signInSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Vérifiez les champs indiqués." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Votre adresse e-mail n'est pas encore confirmée. Consultez le lien reçu par e-mail."
        : "Adresse e-mail ou mot de passe incorrect.";
    return { ok: false, message };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")?.toString()));
}

export async function signUp(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Vérifiez les champs indiqués." };

  const origin = (await headers()).get("origin") ?? env.siteUrl;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${origin}/auth/confirm?next=/espace`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, message: "Un compte existe déjà avec cette adresse. Essayez de vous connecter." };
    }
    if (error.code === "weak_password") {
      return { ok: false, message: "Mot de passe trop faible. Choisissez-en un plus long ou plus complexe." };
    }
    return { ok: false, message: "La création du compte a échoué. Réessayez dans quelques instants." };
  }

  // Si la confirmation par e-mail est activée, aucune session n'est ouverte.
  if (!data.session) {
    return {
      ok: true,
      message: "Compte créé. Un e-mail de confirmation vous a été envoyé : cliquez sur le lien qu'il contient pour activer votre compte.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/espace");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
