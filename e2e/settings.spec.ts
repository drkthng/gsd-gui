import { test, expect } from "./fixtures";

test.describe("Settings Page", () => {
  test("renders settings heading and config panel", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText("Settings");
    // The config panel has tabs
    await expect(page.getByRole("tablist")).toBeVisible();
  });
});
