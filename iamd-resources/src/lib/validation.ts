import { z } from "zod";
import { DIFFICULTIES, PROJECT_CATEGORIES, RESOURCE_TYPES, SUBJECT_ICONS } from "@/lib/constants";
import { splitList } from "@/lib/format";

// --- Briques communes --------------------------------------------------------

/** Texte optionnel : une chaîne vide devient null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const optionalUuid = z
  .union([z.uuid("Identifiant invalide."), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value ? value : null));

const httpUrl = z
  .url({ protocol: /^https?$/, message: "Adresse web invalide (http:// ou https://)." })
  .max(2000);

const optionalUrl = z
  .union([httpUrl, z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value ? value : null));

const slug = z
  .string()
  .trim()
  .min(2, "Identifiant trop court.")
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Utilisez uniquement des minuscules, chiffres et tirets (ex. : machine-learning).");

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.boolean(), z.null(), z.undefined()])
  .transform((value) => value === true || value === "on" || value === "true");

const sortOrder = z.coerce.number().int().min(0).max(10000).default(0);

const list = (maxItems: number, maxLength: number, separator?: RegExp) =>
  z
    .string()
    .optional()
    .default("")
    .transform((value) => splitList(value, separator))
    .pipe(z.array(z.string().max(maxLength, `Élément trop long (${maxLength} caractères max).`)).max(maxItems, `${maxItems} éléments maximum.`));

// --- Catalogue ---------------------------------------------------------------

export const programSchema = z.object({
  name: z.string().trim().min(2, "Nom requis.").max(200),
  slug,
  short_name: optionalText(40),
  description: optionalText(4000),
  institution: optionalText(200),
  sort_order: sortOrder,
  is_published: checkbox,
});

export const levelSchema = z.object({
  program_id: z.uuid("Formation requise."),
  name: z.string().trim().min(1, "Nom requis.").max(100),
  sort_order: sortOrder,
});

export const semesterSchema = z.object({
  level_id: z.uuid("Niveau requis."),
  name: z.string().trim().min(1, "Nom requis.").max(100),
  sort_order: sortOrder,
});

export const subjectSchema = z.object({
  name: z.string().trim().min(2, "Nom requis.").max(200),
  slug,
  level_id: z.uuid("Niveau requis."),
  semester_id: optionalUuid,
  short_description: optionalText(300),
  presentation: optionalText(10000),
  objectives: optionalText(10000),
  icon: z.enum(SUBJECT_ICONS).default("book-open"),
  sort_order: sortOrder,
  is_published: checkbox,
});

export const chapterSchema = z.object({
  subject_id: z.uuid(),
  title: z.string().trim().min(1, "Titre requis.").max(200),
  description: optionalText(2000),
  position: sortOrder,
});

// --- Projets -----------------------------------------------------------------

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Titre requis.").max(200),
  slug,
  category: z.enum(PROJECT_CATEGORIES, "Catégorie requise."),
  subject_id: optionalUuid,
  summary: optionalText(300),
  description: optionalText(10000),
  objectives: optionalText(5000),
  technologies: list(30, 60),
  steps: list(40, 500, /\n/),
  prerequisites: optionalText(5000),
  difficulty: z.enum(DIFFICULTIES).default("intermediaire"),
  repository_url: optionalUrl,
  demo_url: optionalUrl,
  is_example: checkbox,
  is_published: checkbox,
});

// --- Ressources ----------------------------------------------------------------

export const resourceSchema = z
  .object({
    title: z.string().trim().min(2, "Titre requis.").max(200),
    description: optionalText(4000),
    type: z.enum(RESOURCE_TYPES, "Type de document requis."),
    subject_id: optionalUuid,
    chapter_id: optionalUuid,
    project_id: optionalUuid,
    source: z
      .string()
      .trim()
      .min(2, "Indiquez la source du document (auteur, établissement, site…).")
      .max(500),
    author: optionalText(200),
    license: optionalText(200),
    keywords: list(20, 50),
    external_url: optionalUrl,
    is_published: checkbox,
    rights_confirmed: checkbox,
  })
  .refine((data) => data.subject_id || data.project_id, {
    message: "Rattachez la ressource à une matière ou à un projet.",
    path: ["subject_id"],
  })
  .refine((data) => !data.chapter_id || data.subject_id, {
    message: "Un chapitre nécessite une matière.",
    path: ["chapter_id"],
  })
  .refine((data) => data.rights_confirmed, {
    message: "Confirmez que vous êtes autorisé à diffuser ce document.",
    path: ["rights_confirmed"],
  });

export const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  size: z.number().int().positive(),
});

/** Chemin de stockage généré par prepareUpload() : AAAA/MM/<uuid>/<nom>. */
export const storagePathSchema = z
  .string()
  .regex(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\/[a-z0-9-]+(\.[a-z0-9]+)?$/, "Chemin de fichier invalide.");

// --- Comptes -----------------------------------------------------------------

export const signInSchema = z.object({
  email: z.email("Adresse e-mail invalide.").max(254),
  password: z.string().min(1, "Mot de passe requis.").max(128),
});

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
    email: z.email("Adresse e-mail invalide.").max(254),
    password: z
      .string()
      .min(8, "8 caractères minimum.")
      .max(128)
      .regex(/[A-Za-z]/, "Le mot de passe doit contenir au moins une lettre.")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre."),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["password_confirm"],
  });

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Indiquez votre nom.").max(120),
});

// --- Recherche ---------------------------------------------------------------

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const searchSchema = z.object({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()).catch(undefined),
  kind: z.preprocess(emptyToUndefined, z.enum(["resource", "project", "subject"]).optional()).catch(undefined),
  level: z.preprocess(emptyToUndefined, z.uuid().optional()).catch(undefined),
  subject: z.preprocess(emptyToUndefined, z.uuid().optional()).catch(undefined),
  type: z.preprocess(emptyToUndefined, z.enum(RESOURCE_TYPES).optional()).catch(undefined),
  chapter: z.preprocess(emptyToUndefined, z.uuid().optional()).catch(undefined),
  category: z.preprocess(emptyToUndefined, z.enum(PROJECT_CATEGORIES).optional()).catch(undefined),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).optional()).catch(undefined),
});
export type SearchInput = z.infer<typeof searchSchema>;

// --- Utilitaires -------------------------------------------------------------

export type FieldErrors = Record<string, string>;
export type ActionState = { ok: boolean; message?: string; errors?: FieldErrors };

export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) result[key] = value;
  }
  return result;
}

export function zodErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] ??= issue.message;
  }
  return errors;
}

/** Normalise un paramètre d'URL (string | string[] | undefined). */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
