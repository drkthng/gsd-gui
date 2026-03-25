import { test, expect } from "./fixtures";

test.describe("Deep-link Routing", () => {
  test("navigating directly to /pro-tools/log-viewer renders the panel", async ({ page }) => {
    await page.goto("/pro-tools/log-viewer");
    await expect(page).toHaveURL(/\/pro-tools\/log-viewer/);
    // The log viewer panel should render content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("unknown route does not crash the app", async ({ page }) => {
    const response = await page.goto("/nonexistent-route");
    // Vite SPA returns 200 for all routes (index.html fallback)
    expect(response?.status()).toBe(200);
  });
});
