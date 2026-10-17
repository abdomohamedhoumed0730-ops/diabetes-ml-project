import { describe, expect, it } from "vitest";
import { slugify, splitList } from "@/lib/format";
import { safeNextPath } from "@/lib/paths";
import { projectSchema, resourceSchema, searchSchema, signUpSchema, storagePathSchema, subjectSchema } from "@/lib/validation";

const UUID = "3f1b2c4d-5e6f-4a1b-8c9d-0e1f2a3b4c5d";

describe("resourceSchema", () => {
  const base = { title: "Chapitre 1", type: "cours", subject_id: UUID, source: "Enseignant du module", rights_confirmed: "on" };

  it("accepte une ressource valide et normalise les champs", () => {
    const result = resourceSchema.parse({ ...base, keywords: "régression, sklearn, régression", description: "", is_published: "on" });
    expect(result.keywords).toEqual(["régression", "sklearn"]);
    expect(result.description).toBeNull();
    expect(result.is_published).toBe(true);
    expect(result.chapter_id).toBeNull();
  });

  it("exige une source et la confirmation des droits", () => {
    expect(resourceSchema.safeParse({ ...base, source: "" }).success).toBe(false);
    expect(resourceSchema.safeParse({ ...base, rights_confirmed: undefined }).success).toBe(false);
  });

  it("exige un rattachement à une matière ou un projet", () => {
    expect(resourceSchema.safeParse({ ...base, subject_id: "" }).success).toBe(false);
    expect(resourceSchema.safeParse({ ...base, subject_id: "", project_id: UUID }).success).toBe(true);
  });

  it("refuse les liens non http(s) et les types inconnus", () => {
    expect(resourceSchema.safeParse({ ...base, external_url: "javascript:alert(1)" }).success).toBe(false);
    expect(resourceSchema.safeParse({ ...base, external_url: "https://scikit-learn.org" }).success).toBe(true);
    expect(resourceSchema.safeParse({ ...base, type: "virus" }).success).toBe(false);
  });
});

describe("autres schémas", () => {
  it("valide les identifiants d'URL des matières", () => {
    const subject = { name: "Deep Learning", level_id: UUID };
    expect(subjectSchema.safeParse({ ...subject, slug: "deep-learning" }).success).toBe(true);
    expect(subjectSchema.safeParse({ ...subject, slug: "Deep Learning" }).success).toBe(false);
  });

  it("découpe les étapes d'un projet par ligne", () => {
    const project = projectSchema.parse({ title: "Projet", slug: "projet", category: "nlp", steps: "Collecte, nettoyage\nModélisation\n\n", technologies: "Python, spaCy" });
    expect(project.steps).toEqual(["Collecte, nettoyage", "Modélisation"]);
    expect(project.technologies).toEqual(["Python", "spaCy"]);
  });

  it("vérifie le mot de passe à l'inscription", () => {
    const user = { full_name: "Amina", email: "amina@exemple.dj" };
    expect(signUpSchema.safeParse({ ...user, password: "court1", password_confirm: "court1" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...user, password: "motdepasse", password_confirm: "motdepasse" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...user, password: "motdepasse1", password_confirm: "autre1234" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...user, password: "motdepasse1", password_confirm: "motdepasse1" }).success).toBe(true);
  });

  it("ignore les paramètres de recherche invalides au lieu d'échouer", () => {
    const parsed = searchSchema.parse({ q: "  cnn ", type: "inconnu", level: "pas-un-uuid", page: "2", kind: "" });
    expect(parsed).toEqual({ q: "cnn", type: undefined, level: undefined, page: 2, kind: undefined, subject: undefined, chapter: undefined, category: undefined });
  });

  it("n'accepte que les chemins de stockage générés par le serveur", () => {
    expect(storagePathSchema.safeParse(`2026/10/${UUID}/cours.pdf`).success).toBe(true);
    expect(storagePathSchema.safeParse(`2026/10/${UUID}/../../secret.pdf`).success).toBe(false);
    expect(storagePathSchema.safeParse("autre/chemin.pdf").success).toBe(false);
  });
});

describe("utilitaires", () => {
  it("génère des slugs", () => {
    expect(slugify("Traitement automatique du langage (NLP)")).toBe("traitement-automatique-du-langage-nlp");
  });

  it("empêche les redirections ouvertes", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("https://malveillant.example")).toBe("/espace");
    expect(safeNextPath("//malveillant.example")).toBe("/espace");
    expect(safeNextPath("/\\malveillant.example")).toBe("/espace");
  });

  it("découpe les listes", () => {
    expect(splitList(" a, b ,, a\nc ")).toEqual(["a", "b", "c"]);
  });
});
