import { expect, test } from "@playwright/test";

test("navigation mobile et absence de défilement horizontal", async ({ page }) => {
  for (const path of ["/", "/matieres", "/matieres/machine-learning", "/recherche?q=data", "/projets/exemple-classification-supervisee"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  const menu = page.getByRole("navigation", { name: "Navigation mobile" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Projets" }).click();
  await expect(page).toHaveURL(/\/projets$/);
  await expect(page.getByRole("navigation", { name: "Navigation mobile" })).toHaveCount(0);
});
