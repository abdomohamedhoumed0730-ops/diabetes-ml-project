import { expect, test } from "@playwright/test";

test("un étudiant crée un compte, ajoute un favori et retrouve son historique", async ({ page }) => {
  const email = `etudiant-${Date.now().toString(36)}@iamd.test`;
  await page.goto("/inscription");
  await page.getByLabel("Nom complet").fill("Étudiant Test");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("faible");
  await page.getByLabel("Confirmer le mot de passe").fill("faible");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByText("8 caractères minimum.")).toBeVisible();

  await page.getByLabel("Mot de passe", { exact: true }).fill("Etudiant2026");
  await page.getByLabel("Confirmer le mot de passe").fill("Etudiant2026");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/espace/);
  await expect(page.getByText("Aucun favori")).toBeVisible();

  await page.goto("/projets/exemple-classification-supervisee");
  await page.getByRole("button", { name: "Ajouter aux favoris" }).click();
  await expect(page.getByRole("button", { name: "Retirer des favoris" })).toBeVisible();

  await page.goto("/espace");
  await expect(page.getByRole("link", { name: /Exemple : classification supervisée/ }).first()).toBeVisible();
  await expect(page.getByText("Consulté le")).toBeVisible();

  // Un étudiant n'a pas accès à l'administration.
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(0);
  await page.goto("/admin");
  await expect(page).toHaveURL(/erreur=acces-refuse/);
  await expect(page.getByText("Accès refusé")).toBeVisible();

  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page.getByRole("link", { name: "Connexion" }).first()).toBeVisible();
});

test("une erreur de connexion affiche un message clair", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Adresse e-mail").fill("inconnu@iamd.test");
  await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Adresse e-mail ou mot de passe incorrect." })).toBeVisible();
});
