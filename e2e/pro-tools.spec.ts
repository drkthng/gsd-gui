import { test, expect } from "./fixtures";

test.describe("Pro Tools", () => {
  test("grid renders panel categories and cards", async ({ page }) => {
    await page.goto("/pro-tools");
    await expect(page.locator("h1")).toContainText("Pro Tools");
    // At least one category section renders
    await expect(page.locator('[data-testid="panel-category"]').first()).toBeVisible();
    // At least one panel card renders
    await expect(page.locator('[data-testid="panel-card"]').first()).toBeVisible();
  });

  test("clicking a panel card navigates to the panel", async ({ page }) => {
    await page.goto("/pro-tools");
    const firstCard = page.locator('[data-testid="panel-card"]').first();
    await firstCard.click();
    // Should navigate to a pro-tools sub-route
    await expect(page).toHaveURL(/\/pro-tools\/.+/);
  });
});
