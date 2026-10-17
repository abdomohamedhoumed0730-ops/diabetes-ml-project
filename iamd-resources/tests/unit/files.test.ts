import { describe, expect, it } from "vitest";
import { checkFileContent, checkFileMeta, formatBytes, getExtension, sanitizeFileName } from "@/lib/files";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

describe("checkFileMeta", () => {
  it("accepte les formats autorisés dans la limite de taille", () => {
    expect(checkFileMeta("cours.pdf", 1024).ok).toBe(true);
    expect(checkFileMeta("TP1.IPYNB", 2048).ok).toBe(true);
    expect(checkFileMeta("donnees.csv", 10 * 1024 * 1024).ok).toBe(true);
  });

  it("refuse les formats dangereux ou inconnus", () => {
    for (const name of ["page.html", "image.svg", "script.js", "programme.exe", "archive.tar.gz", "sans-extension"]) {
      expect(checkFileMeta(name, 100).ok, name).toBe(false);
    }
  });

  it("refuse les fichiers vides ou trop volumineux", () => {
    expect(checkFileMeta("cours.pdf", 0).ok).toBe(false);
    expect(checkFileMeta("cours.pdf", 51 * 1024 * 1024).ok).toBe(false);
    expect(checkFileMeta("capture.png", 6 * 1024 * 1024).ok).toBe(false);
  });
});

describe("checkFileContent", () => {
  it("vérifie la signature des PDF", () => {
    expect(checkFileContent("pdf", text("%PDF-1.7\n...")).ok).toBe(true);
    expect(checkFileContent("pdf", text("<html>pas un pdf</html>")).ok).toBe(false);
  });

  it("vérifie la signature des archives ZIP et documents Office", () => {
    expect(checkFileContent("zip", bytes(0x50, 0x4b, 0x03, 0x04, 0x14)).ok).toBe(true);
    expect(checkFileContent("docx", bytes(0x50, 0x4b, 0x03, 0x04)).ok).toBe(true);
    expect(checkFileContent("zip", text("MZ executable")).ok).toBe(false);
  });

  it("vérifie les images", () => {
    expect(checkFileContent("png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)).ok).toBe(true);
    expect(checkFileContent("jpg", bytes(0xff, 0xd8, 0xff, 0xe0)).ok).toBe(true);
    expect(checkFileContent("webp", text("RIFF\x00\x00\x00\x00WEBPVP8 ")).ok).toBe(true);
    expect(checkFileContent("webp", text("RIFF\x00\x00\x00\x00WAVEfmt ")).ok).toBe(false);
    expect(checkFileContent("png", text("<svg onload=alert(1)>")).ok).toBe(false);
  });

  it("vérifie les fichiers texte (UTF-8, sans octet nul)", () => {
    expect(checkFileContent("csv", text("nom;âge\nAmina;24\n")).ok).toBe(true);
    expect(checkFileContent("csv", bytes(0x61, 0x00, 0x62)).ok).toBe(false);
    expect(checkFileContent("csv", bytes(0x61, 0xff, 0xfe, 0x62)).ok).toBe(false);
    // caractère multi-octets coupé en fin d'échantillon : accepté
    expect(checkFileContent("csv", text("données é").slice(0, -1)).ok).toBe(true);
  });

  it("vérifie les notebooks Jupyter", () => {
    expect(checkFileContent("ipynb", text('\n  {"cells": [], "nbformat": 4}')).ok).toBe(true);
    expect(checkFileContent("ipynb", text("print('hello')")).ok).toBe(false);
  });

  it("refuse un contenu vide ou un format inconnu", () => {
    expect(checkFileContent("pdf", new Uint8Array()).ok).toBe(false);
    expect(checkFileContent("html", text("<html>")).ok).toBe(false);
  });
});

describe("utilitaires de fichiers", () => {
  it("normalise les noms de fichiers", () => {
    expect(sanitizeFileName("Cours n°1 — Régression Linéaire.PDF")).toBe("cours-n-1-regression-lineaire.pdf");
    expect(sanitizeFileName("../../etc/passwd.csv")).toBe("etc-passwd.csv");
    expect(sanitizeFileName("###.zip")).toBe("fichier.zip");
  });

  it("extrait l'extension", () => {
    expect(getExtension("a.b.CSV")).toBe("csv");
    expect(getExtension("README")).toBe("");
  });

  it("formate les tailles", () => {
    expect(formatBytes(500)).toBe("500 o");
    expect(formatBytes(2048)).toBe("2 Ko");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1,5 Mo");
  });
});
