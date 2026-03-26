import { test, expect } from "./fixtures";

test.describe("Projects – demo data", () => {
  test("displays all three demo projects", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toContainText("Projects");

    // All three demo projects should be visible (exact match avoids path collisions)
    await expect(page.getByText("gsd-gui", { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("my-saas-app", { exact: true })).toBeVisible();
    await expect(page.getByText("open-source-lib", { exact: true })).toBeVisible();
  });

  test("shows project descriptions", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toContainText("Projects");

    // Verify at least one project description is visible
    await expect(
      page.getByText("Tauri 2 desktop GUI for GSD", { exact: false }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText("Full-stack SaaS starter", { exact: false }),
    ).toBeVisible();
  });

  test("search filters projects by name", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toContainText("Projects");

    // Wait for projects to load
    await expect(page.getByText("gsd-gui", { exact: true })).toBeVisible({ timeout: 5_000 });

    // Search for a specific project
    const searchInput = page.getByPlaceholder("Search projects…");
    await searchInput.fill("saas");

    // Only the matching project should be visible
    await expect(page.getByText("my-saas-app", { exact: true })).toBeVisible();
    // Other projects should not be visible
    await expect(page.getByText("open-source-lib", { exact: true })).not.toBeVisible();
  });

  test("clicking a project card selects it", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator("h1")).toContainText("Projects");

    // Wait for projects to load
    await expect(page.getByText("gsd-gui", { exact: true })).toBeVisible({ timeout: 5_000 });

    // Click on the gsd-gui project card
    await page.getByText("gsd-gui", { exact: true }).click();

    // Navigate to milestones via sidebar link (SPA navigation preserves Zustand state)
    await page.getByRole("link", { name: "Milestones" }).click();
    await expect(page.locator("h1")).toContainText("Milestones");

    // The milestone data should load (not the "No project selected" message)
    await expect(page.getByText("No project selected")).not.toBeVisible({ timeout: 5_000 });
  });
});
