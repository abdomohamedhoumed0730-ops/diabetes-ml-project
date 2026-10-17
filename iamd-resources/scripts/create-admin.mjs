#!/usr/bin/env node
// Crée (si nécessaire) un compte et lui attribue le rôle administrateur.
//
// Usage :
//   node --env-file=.env.local scripts/create-admin.mjs admin@exemple.dj
//   node --env-file=.env.local scripts/create-admin.mjs admin@exemple.dj --password "MotDePasse123"
//
// Nécessite NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY).
// Cette clé donne un accès total : ne l'exposez jamais côté navigateur et ne la commitez pas.

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const email = args.find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();
const passwordIndex = args.indexOf("--password");
let password = passwordIndex >= 0 ? args[passwordIndex + 1] : undefined;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage : node --env-file=.env.local scripts/create-admin.mjs <email> [--password <mot de passe>]");
  process.exit(1);
}
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) doivent être définies.");
  process.exit(1);
}
if (password !== undefined && password.length < 8) {
  console.error("Le mot de passe doit contenir au moins 8 caractères.");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserByEmail(target) {
  for (let page = 1; page < 100; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === target);
    if (user) return user;
    if (data.users.length < 200) return null;
  }
  return null;
}

let user = await findUserByEmail(email);
let generated = false;
if (!user) {
  if (!password) {
    password = randomBytes(12).toString("base64url");
    generated = true;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    console.error(`Création du compte impossible : ${error.message}`);
    process.exit(1);
  }
  user = data.user;
  console.log(`Compte créé pour ${email}.`);
} else {
  console.log(`Compte existant trouvé pour ${email}.`);
}

const { error: roleError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
if (roleError) {
  console.error(`Attribution du rôle impossible : ${roleError.message}`);
  process.exit(1);
}

console.log(`✔ ${email} est maintenant administrateur.`);
if (generated) {
  console.log(`Mot de passe temporaire : ${password}`);
  console.log("Conservez-le en lieu sûr ; il peut être modifié depuis le tableau de bord Supabase (Authentication → Users).");
}
