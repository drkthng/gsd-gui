import { test, expect } from "./fixtures";

test.describe("App Launch", () => {
  test("loads and redirects to /chat with heading", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.locator("h1")).toContainText("Chat");
  });
});
