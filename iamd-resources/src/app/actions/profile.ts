"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, profileSchema, zodErrors, type ActionState } from "@/lib/validation";

export async function updateProfile(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Vous devez être connecté." };

  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error), message: "Vérifiez les champs indiqués." };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
  if (error) return { ok: false, message: "La mise à jour a échoué." };
  revalidatePath("/espace");
  return { ok: true, message: "Profil mis à jour." };
}
