"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, safeNextPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const toggleSchema = z
  .object({
    resource_id: z.uuid().optional(),
    project_id: z.uuid().optional(),
    path: z.string().max(300).optional(),
  })
  .refine((data) => Boolean(data.resource_id) !== Boolean(data.project_id));

export async function toggleFavorite(formData: FormData) {
  const parsed = toggleSchema.safeParse({
    resource_id: formData.get("resource_id") || undefined,
    project_id: formData.get("project_id") || undefined,
    path: formData.get("path") || undefined,
  });
  if (!parsed.success) return;
  const path = safeNextPath(parsed.data.path, "/espace");

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(path)}`);

  const supabase = await createClient();
  const column = parsed.data.resource_id ? "resource_id" : "project_id";
  const targetId = (parsed.data.resource_id ?? parsed.data.project_id)!;

  const { data: existing } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq(column, targetId).maybeSingle();
  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("favorites")
      .insert(parsed.data.resource_id ? { user_id: user.id, resource_id: targetId } : { user_id: user.id, project_id: targetId });
  }
  revalidatePath(path);
  revalidatePath("/espace");
}
