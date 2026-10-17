import { expect, test, type Browser } from "@playwright/test";
import { E2E_ADMIN, minimalPdf, signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

const run = Date.now().toString(36);
const subjectName = `Matière E2E ${run}`;
const resourceTitle = `Support E2E ${run}`;
const keyword = `motcle${run}`;
let subjectUrl = "";
let resourceId = "";

async function anonymousPage(browser: Browser) {
  const context = await browser.newContext();
  return { page: await context.newPage(), close: () => context.close() };
}

test("l'administrateur crée une matière et un chapitre", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password, "/admin");
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

  await page.goto("/admin/matieres/nouvelle");
  await page.getByLabel("Nom de la matière").fill(subjectName);
  await expect(page.getByLabel("Identifiant d'URL")).toHaveValue(`matiere-e2e-${run}`);
  await page.getByLabel("Description courte (cartes)").fill("Matière créée par les tests automatisés.");
  await page.getByRole("button", { name: "Créer la matière" }).click();
  await expect(page.getByText("Matière créée. Vous pouvez maintenant ajouter ses chapitres.")).toBeVisible();
  subjectUrl = page.url();

  await page.getByPlaceholder("Titre du chapitre").fill("Introduction");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByText("Chapitre ajouté.")).toBeVisible();
  await expect(page.locator('input[value="Introduction"]')).toBeVisible();
});

test("un faux PDF est refusé après vérification du contenu", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password, "/admin");
  await page.goto("/admin/ressources/nouvelle");
  await page.getByLabel(/^Titre \*$/).fill(`Faux ${run}`);
  await page.getByLabel("Type de document").selectOption("cours");
  await page.getByLabel("Matière", { exact: true }).selectOption({ label: subjectName });
  await page.locator("#file-input").setInputFiles({ name: "faux.pdf", mimeType: "application/pdf", buffer: Buffer.from("<html>ceci n'est pas un pdf</html>") });
  await page.getByLabel(/^Source \*$/).fill("Test");
  await page.getByLabel(/Je confirme être autorisé/).check();
  await page.getByRole("button", { name: "Enregistrer la ressource" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "ne correspond pas au format PDF" })).toBeVisible();
});

test("un format interdit est bloqué avant l'envoi", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password, "/admin");
  await page.goto("/admin/ressources/nouvelle");
  await page.locator("#file-input").setInputFiles({ name: "page.html", mimeType: "text/html", buffer: Buffer.from("<script>alert(1)</script>") });
  await expect(page.getByText(/Format non autorisé \(\.html\)/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Enregistrer la ressource" })).toBeDisabled();
});

test("l'administrateur téléverse et publie un PDF", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password, "/admin");
  await page.goto(subjectUrl);
  await page.getByRole("link", { name: "Ajouter une ressource" }).click();
  await expect(page.getByLabel("Matière", { exact: true })).toHaveValue(/[0-9a-f-]{36}/);

  await page.getByLabel(/^Titre \*$/).fill(resourceTitle);
  await page.getByLabel("Description", { exact: true }).fill("Support de test : introduction au cours.");
  await page.getByLabel("Type de document").selectOption("cours");
  await page.getByLabel("Chapitre", { exact: true }).selectOption({ label: "Introduction" });
  await page.getByLabel("Mots-clés").fill(`${keyword}, introduction`);
  await page.locator("#file-input").setInputFiles({ name: "Introduction au cours.pdf", mimeType: "application/pdf", buffer: minimalPdf() });
  await page.getByLabel(/^Source \*$/).fill("Tests automatisés IAMD Resources");
  await page.getByLabel("Auteur(s)").fill("Équipe de test");
  await page.getByLabel(/Je confirme être autorisé/).check();
  await page.getByRole("button", { name: "Enregistrer la ressource" }).click();

  await expect(page).toHaveURL(/\/admin\/ressources\?cree=1/);
  const row = page.getByRole("row", { name: new RegExp(resourceTitle) });
  await expect(row).toContainText("Brouillon");
  resourceId = (await row.getByRole("link", { name: resourceTitle }).getAttribute("href"))!.split("/").pop()!;

  // Un brouillon n'est pas visible publiquement.
  const anon = await anonymousPage(page.context().browser()!);
  await anon.page.goto(`/ressources/${resourceId}`);
  await expect(anon.page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  await anon.close();

  await row.getByRole("button", { name: "Publier" }).click();
  await expect(page.getByRole("row", { name: new RegExp(resourceTitle) })).toContainText("Publiée");
});

test("un visiteur consulte, prévisualise, télécharge et retrouve le document", async ({ browser }) => {
  const { page, close } = await anonymousPage(browser);
  await page.goto(`/recherche?q=${keyword}`);
  await expect(page.getByText("1 résultat")).toBeVisible();
  await page.getByRole("link", { name: new RegExp(resourceTitle) }).click();

  await expect(page.getByRole("heading", { level: 1, name: resourceTitle })).toBeVisible();
  await expect(page.getByText("Tests automatisés IAMD Resources")).toBeVisible();
  await expect(page.getByText("Introduction au cours.pdf")).toBeVisible();

  await page.getByRole("button", { name: "Afficher l'aperçu" }).click();
  await expect(page.locator("iframe")).toHaveAttribute("src", /\/storage\/v1\/object\/sign\/documents\//);

  const response = await page.request.get(`/api/ressources/${resourceId}/fichier`);
  expect(response.status()).toBe(200);
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  expect(response.headers()["content-disposition"]).toContain("attachment");

  // La matière liste le document sous son chapitre.
  await page.getByRole("navigation", { name: "Fil d'Ariane" }).getByRole("link", { name: subjectName }).click();
  const chapter = page.getByRole("listitem").filter({ hasText: "Chapitre 1." });
  await expect(chapter).toContainText("Introduction");
  await expect(chapter.getByRole("link", { name: resourceTitle })).toBeVisible();
  await close();
});

test("les statistiques reflètent la consultation et le téléchargement", async ({ page }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password, "/admin");
  const row = page.getByRole("row", { name: new RegExp(resourceTitle) });
  await expect(row).toBeVisible();
  const cells = row.getByRole("cell");
  await expect(cells.nth(2)).toHaveText(/[1-9]/);
  await expect(cells.nth(3)).toHaveText(/[1-9]/);
});

test("dépublication puis suppression de la ressource et de la matière", async ({ page, browser }) => {
  await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password, "/admin/ressources");
  await page.getByRole("row", { name: new RegExp(resourceTitle) }).getByRole("button", { name: "Dépublier" }).click();
  await expect(page.getByRole("row", { name: new RegExp(resourceTitle) })).toContainText("Brouillon");

  const anon = await anonymousPage(browser);
  const blocked = await anon.page.request.get(`/api/ressources/${resourceId}/fichier`);
  expect(blocked.status()).toBe(404);
  await anon.close();

  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(`/admin/ressources/${resourceId}`);
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page).toHaveURL(/supprime=1/);

  await page.goto(subjectUrl);
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/matieres\?supprime=1/);
  await expect(page.getByText(subjectName)).toHaveCount(0);
});
