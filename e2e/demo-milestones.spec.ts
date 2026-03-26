import { test, expect } from "./fixtures";

test.describe("Milestones – demo data", () => {
  /**
   * Helper: navigate to projects, select the first demo project,
   * then navigate to milestones via sidebar (SPA navigation preserves state).
   */
  async function selectProjectAndGoToMilestones(page: import("@playwright/test").Page) {
    await page.goto("/projects");
    await expect(page.getByText("gsd-gui", { exact: true })).toBeVisible({ timeout: 5_000 });
    await page.getByText("gsd-gui", { exact: true }).click();
    // Navigate via sidebar to preserve Zustand state
    await page.getByRole("link", { name: "Milestones" }).click();
    await expect(page.locator("h1")).toContainText("Milestones");
  }

  test("shows 'No project selected' without an active project", async ({ page }) => {
    await page.goto("/milestones");
    await expect(page.locator("h1")).toContainText("Milestones");
    await expect(page.getByText("No project selected")).toBeVisible({ timeout: 5_000 });
  });

  test("displays milestone data after selecting a project", async ({ page }) => {
    await selectProjectAndGoToMilestones(page);

    // Demo data includes M001, M002, M003 — their titles should appear
    await expect(page.getByText("Project Scaffolding & Core Shell")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Backend Bridge")).toBeVisible();
    await expect(page.getByText("Core Screens")).toBeVisible();
  });

  test("filter bar renders with correct counts", async ({ page }) => {
    await selectProjectAndGoToMilestones(page);

    // Wait for milestones to load
    await expect(page.getByText("Project Scaffolding & Core Shell")).toBeVisible({ timeout: 10_000 });

    // Filter bar should show All, Active, Complete, Planned buttons
    const filterGroup = page.getByRole("group", { name: "Filter milestones by status" });
    await expect(filterGroup).toBeVisible();

    // Check filter button labels exist
    await expect(filterGroup.getByRole("button", { name: /All/i })).toBeVisible();
    await expect(filterGroup.getByRole("button", { name: /Active/i })).toBeVisible();
    await expect(filterGroup.getByRole("button", { name: /Complete/i })).toBeVisible();
  });

  test("filtering by status shows correct milestones", async ({ page }) => {
    await selectProjectAndGoToMilestones(page);
    await expect(page.getByText("Project Scaffolding & Core Shell")).toBeVisible({ timeout: 10_000 });

    const filterGroup = page.getByRole("group", { name: "Filter milestones by status" });

    // Click "Complete" filter — M001 and M002 are done
    await filterGroup.getByRole("button", { name: /Complete/i }).click();
    await expect(page.getByText("Project Scaffolding & Core Shell")).toBeVisible();
    await expect(page.getByText("Backend Bridge")).toBeVisible();

    // Click "Active" filter — only M003 is in-progress
    await filterGroup.getByRole("button", { name: /Active/i }).click();
    await expect(page.getByText("Core Screens")).toBeVisible();
  });
});
