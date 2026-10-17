import { createClient } from "@supabase/supabase-js";
import { E2E_ADMIN } from "./helpers";

/** Crée (ou réinitialise) le compte administrateur utilisé par les tests. */
export default async function globalSetup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Lancez les tests avec : node --env-file=.env.local … (variables Supabase manquantes)");
  const supabase = createClient(url, secret, { auth: { persistSession: false } });

  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users.find((user) => user.email === E2E_ADMIN.email);
  const id = existing
    ? (await supabase.auth.admin.updateUserById(existing.id, { password: E2E_ADMIN.password })).data.user!.id
    : (await supabase.auth.admin.createUser({ email: E2E_ADMIN.email, password: E2E_ADMIN.password, email_confirm: true })).data.user!.id;
  const { error } = await supabase.from("profiles").update({ role: "admin", full_name: "Admin E2E" }).eq("id", id);
  if (error) throw error;
}
