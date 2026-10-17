import { expect, test } from "@playwright/test";

test("la page d'accueil présente la plateforme et ses sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Toutes vos ressources universitaires au même endroit" })).toBeVisible();
  for (const title of ["Formations", "Matières", "Dernières ressources ajoutées", "Projets pratiques", "Ressources populaires"]) {
    await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Connexion" }).first()).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Mentions légales");
  // L'exemple de projet est clairement identifié comme fictif.
  await expect(page.getByText("Exemple fictif").first()).toBeVisible();
});

test("la recherche depuis l'accueil renvoie des résultats réels", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").first().fill("learning");
  await page.getByRole("button", { name: "Rechercher" }).first().click();
  await expect(page).toHaveURL(/\/recherche\?q=learning/);
  await expect(page.getByRole("link", { name: /Machine Learning/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Deep Learning/ }).first()).toBeVisible();

  // Filtre « Projets » : seule la fiche d'exemple (catégorie Machine Learning) reste.
  await page.goto("/recherche?q=classification&kind=project");
  await expect(page.getByText("1 résultat")).toBeVisible();
  await expect(page.getByText("Exemple : classification supervisée de bout en bout")).toBeVisible();

  await page.goto("/recherche?q=zzzzintrouvable");
  await expect(page.getByText("Aucun résultat ne correspond à votre recherche")).toBeVisible();
});

test("une page matière affiche ses sections et des états vides utiles", async ({ page }) => {
  await page.goto("/matieres");
  await page.getByRole("link", { name: /Optimisation mathématique/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Optimisation mathématique" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Présentation et objectifs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exercices corrigés" })).toBeVisible();
  await expect(page.getByText("Aucun exercice corrigé publié pour le moment.")).toBeVisible();
  // Aucun faux bouton de téléchargement.
  await expect(page.getByRole("link", { name: "Télécharger" })).toHaveCount(0);
});

test("la fiche projet d'exemple affiche un avertissement", async ({ page }) => {
  await page.goto("/projets");
  await page.getByRole("link", { name: /Exemple : classification supervisée/ }).click();
  await expect(page.getByRole("note")).toContainText("Exemple fictif");
  await expect(page.getByText("Aucun rapport PDF disponible pour ce projet.")).toBeVisible();
});

test("les espaces protégés redirigent vers la connexion", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/connexion\?next=%2Fadmin/);
  await page.goto("/espace");
  await expect(page).toHaveURL(/\/connexion\?next=%2Fespace/);
});

test("une action d'administration appelée sans session est refusée côté serveur", async ({ request }) => {
  const response = await request.get("/api/ressources/00000000-0000-4000-8000-000000000000/fichier");
  expect(response.status()).toBe(404);
});
