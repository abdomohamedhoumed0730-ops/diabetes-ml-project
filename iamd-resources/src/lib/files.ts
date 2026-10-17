// Règles de validation des fichiers téléversés.
// Ces contrôles sont appliqués côté serveur (actions serveur) ; le bucket
// Supabase applique en plus une taille maximale et une liste de types MIME.

export type FileRule = {
  mime: string;
  maxBytes: number;
  /** Signatures binaires acceptées (début du fichier). */
  magic?: number[][];
  /** Fichier texte : doit être de l'UTF-8 sans octet nul. */
  text?: boolean;
  /** Le contenu doit commencer par « { » (JSON / notebook). */
  json?: boolean;
  /** Prévisualisation possible dans le navigateur. */
  preview?: "pdf" | "image";
  label: string;
};

const MB = 1024 * 1024;
const ZIP_MAGIC = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
];

export const MAX_UPLOAD_BYTES = 50 * MB;

export const FILE_RULES: Record<string, FileRule> = {
  pdf: { mime: "application/pdf", maxBytes: 50 * MB, magic: [[0x25, 0x50, 0x44, 0x46, 0x2d]], preview: "pdf", label: "PDF" },
  zip: { mime: "application/zip", maxBytes: 50 * MB, magic: ZIP_MAGIC, label: "Archive ZIP" },
  csv: { mime: "text/csv", maxBytes: 50 * MB, text: true, label: "CSV" },
  ipynb: { mime: "application/x-ipynb+json", maxBytes: 20 * MB, text: true, json: true, label: "Notebook Jupyter" },
  json: { mime: "application/json", maxBytes: 20 * MB, text: true, json: true, label: "JSON" },
  txt: { mime: "text/plain", maxBytes: 5 * MB, text: true, label: "Texte" },
  md: { mime: "text/markdown", maxBytes: 5 * MB, text: true, label: "Markdown" },
  py: { mime: "text/x-python", maxBytes: 5 * MB, text: true, label: "Script Python" },
  r: { mime: "text/x-r", maxBytes: 5 * MB, text: true, label: "Script R" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    maxBytes: 30 * MB,
    magic: ZIP_MAGIC,
    label: "Document Word",
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    maxBytes: 50 * MB,
    magic: ZIP_MAGIC,
    label: "Présentation PowerPoint",
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    maxBytes: 30 * MB,
    magic: ZIP_MAGIC,
    label: "Classeur Excel",
  },
  png: { mime: "image/png", maxBytes: 5 * MB, magic: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], preview: "image", label: "Image PNG" },
  jpg: { mime: "image/jpeg", maxBytes: 5 * MB, magic: [[0xff, 0xd8, 0xff]], preview: "image", label: "Image JPEG" },
  jpeg: { mime: "image/jpeg", maxBytes: 5 * MB, magic: [[0xff, 0xd8, 0xff]], preview: "image", label: "Image JPEG" },
  webp: { mime: "image/webp", maxBytes: 5 * MB, magic: [[0x52, 0x49, 0x46, 0x46]], preview: "image", label: "Image WebP" },
};

export const ACCEPT_ATTRIBUTE = Object.keys(FILE_RULES)
  .map((ext) => `.${ext}`)
  .join(",");

export function getExtension(fileName: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  return match ? match[1].toLowerCase() : "";
}

export function getFileRule(fileName: string): FileRule | null {
  return FILE_RULES[getExtension(fileName)] ?? null;
}

/** Nom de fichier sûr pour le stockage : sans accents, espaces ni caractères spéciaux. */
export function sanitizeFileName(fileName: string): string {
  const ext = getExtension(fileName);
  const base = fileName
    .replace(/\.[^.]*$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "fichier"}${ext ? `.${ext}` : ""}`;
}

export type FileCheck = { ok: true; rule: FileRule; extension: string } | { ok: false; error: string };

/** Vérifie le nom et la taille déclarés d'un fichier avant téléversement. */
export function checkFileMeta(fileName: string, size: number): FileCheck {
  const extension = getExtension(fileName);
  const rule = FILE_RULES[extension];
  if (!rule) {
    return {
      ok: false,
      error: `Format non autorisé (.${extension || "?"}). Formats acceptés : ${Object.keys(FILE_RULES).join(", ")}.`,
    };
  }
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: "Le fichier est vide." };
  }
  if (size > rule.maxBytes) {
    return { ok: false, error: `Fichier trop volumineux : ${formatBytes(size)} (maximum ${formatBytes(rule.maxBytes)} pour ce format).` };
  }
  return { ok: true, rule, extension };
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

/** Vérifie que le contenu réel du fichier correspond à son extension. */
export function checkFileContent(extension: string, head: Uint8Array): { ok: true } | { ok: false; error: string } {
  const rule = FILE_RULES[extension];
  if (!rule) return { ok: false, error: "Format non autorisé." };
  if (head.length === 0) return { ok: false, error: "Le fichier est vide." };

  if (rule.magic && !rule.magic.some((signature) => startsWith(head, signature))) {
    return { ok: false, error: `Le contenu du fichier ne correspond pas au format ${rule.label}.` };
  }
  if (extension === "webp") {
    const tag = String.fromCharCode(...head.slice(8, 12));
    if (tag !== "WEBP") return { ok: false, error: "Le contenu du fichier ne correspond pas au format WebP." };
  }
  if (rule.text) {
    if (head.includes(0)) {
      return { ok: false, error: "Le fichier texte contient des données binaires." };
    }
    // Ignore un éventuel caractère multi-octets coupé en fin d'échantillon.
    const sample = trimIncompleteUtf8(head);
    try {
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(sample);
      if (rule.json && !decoded.replace(/^﻿/, "").trimStart().startsWith("{")) {
        return { ok: false, error: "Le fichier ne semble pas être un JSON / notebook valide." };
      }
    } catch {
      return { ok: false, error: "Le fichier texte doit être encodé en UTF-8." };
    }
  }
  return { ok: true };
}

function trimIncompleteUtf8(bytes: Uint8Array): Uint8Array {
  let end = bytes.length;
  // Recule sur au plus 3 octets de continuation.
  for (let i = 1; i <= Math.min(4, bytes.length); i++) {
    const byte = bytes[bytes.length - i];
    if ((byte & 0xc0) === 0x80) continue; // octet de continuation
    if ((byte & 0x80) === 0) break; // ASCII complet
    const expected = (byte & 0xe0) === 0xc0 ? 2 : (byte & 0xf0) === 0xe0 ? 3 : 4;
    if (i < expected) end = bytes.length - i;
    break;
  }
  return bytes.slice(0, end);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0).replace(".", ",")} Mo`;
}
