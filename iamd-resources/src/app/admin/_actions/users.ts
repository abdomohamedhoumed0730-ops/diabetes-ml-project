"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbErrorMessage, withAdmin } from "@/lib/admin";
import type { ActionState } from "@/lib/validation";

const roleSchema = z.object({ user_id: z.uuid(), role: z.enum(["admin", "student"]) });

export async function setUserRole(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  return withAdmin(async (supabase) => {
    const parsed = roleSchema.safeParse({ user_id: formData.get("user_id"), role: formData.get("role") });
    if (!parsed.success) return { ok: false, message: "Requête invalide." };
    const { error } = await supabase.rpc("set_user_role", { p_user_id: parsed.data.user_id, p_role: parsed.data.role });
    if (error) return { ok: false, message: error.code === "23514" || error.code === "P0002" ? error.message : dbErrorMessage(error) };
    revalidatePath("/admin/utilisateurs");
    return { ok: true, message: "Rôle mis à jour." };
  });
}
