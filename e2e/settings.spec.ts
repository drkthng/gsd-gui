import { test, expect } from "./fixtures";

test.describe("Settings Page", () => {
  test("renders settings heading and 'No project selected' without active project", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText("Settings");
    // Without an active project the ConfigPanel shows an empty state
    await expect(page.getByText("No project selected")).toBeVisible({ timeout: 5_000 });
  });

  test("shows config tabs after selecting a project", async ({ page }) => {
    // Navigate to projects and select the first demo project
    await page.goto("/projects");
    await expect(page.getByText("gsd-gui", { exact: true })).toBeVisible({ timeout: 5_000 });
    await page.getByText("gsd-gui", { exact: true }).click();
    // Navigate via sidebar to preserve Zustand state
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.locator("h1")).toContainText("Settings");
    // The config panel should now show tabs
    await expect(page.getByRole("tablist")).toBeVisible({ timeout: 5_000 });
  });
});
