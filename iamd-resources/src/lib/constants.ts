export const SITE_NAME = "IAMD Resources";

export const RESOURCE_TYPES = [
  "cours",
  "resume",
  "exercice",
  "tp",
  "examen",
  "projet",
  "dataset",
  "capture",
  "lien",
  "autre",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  cours: "Support de cours",
  resume: "Résumé de cours",
  exercice: "Exercices corrigés",
  tp: "Travaux pratiques",
  examen: "Sujet d'examen",
  projet: "Fichier de projet",
  dataset: "Jeu de données",
  capture: "Capture d'écran",
  lien: "Ressource externe",
  autre: "Autre document",
};

/** Ordre et titres des sections d'une page matière. */
export const SUBJECT_SECTIONS: { type: ResourceType; title: string; empty: string }[] = [
  { type: "cours", title: "Chapitres et supports de cours", empty: "Aucun support de cours publié pour le moment." },
  { type: "resume", title: "Résumés de cours", empty: "Aucun résumé publié pour le moment." },
  { type: "exercice", title: "Exercices corrigés", empty: "Aucun exercice corrigé publié pour le moment." },
  { type: "tp", title: "Travaux pratiques", empty: "Aucun TP publié pour le moment." },
  { type: "examen", title: "Sujets d'examens précédents", empty: "Aucun sujet d'examen disponible." },
  { type: "dataset", title: "Jeux de données", empty: "Aucun jeu de données publié." },
  { type: "lien", title: "Ressources externes", empty: "Aucun lien externe ajouté." },
  { type: "autre", title: "Autres documents", empty: "Aucun autre document." },
];

export const PROJECT_CATEGORIES = [
  "ia",
  "machine_learning",
  "deep_learning",
  "nlp",
  "big_data",
  "data_science",
  "modelisation",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ia: "Intelligence artificielle",
  machine_learning: "Machine Learning",
  deep_learning: "Deep Learning",
  nlp: "NLP",
  big_data: "Big Data",
  data_science: "Data Science",
  modelisation: "Modélisation mathématique",
};

export const DIFFICULTIES = ["debutant", "intermediaire", "avance"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export const SUBJECT_ICONS = [
  "book-open",
  "database",
  "brain",
  "cpu",
  "network",
  "message-square-text",
  "sigma",
  "trending-down",
  "bar-chart",
  "table",
  "code",
  "route",
  "folder-kanban",
] as const;
export type SubjectIcon = (typeof SUBJECT_ICONS)[number];

export const STORAGE_BUCKET = "documents";
