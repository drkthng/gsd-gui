import { test, expect } from "./fixtures";

test.describe("Smoke – infrastructure proof", () => {
  test("app loads and shows the shell", async ({ page }) => {
    await page.goto("/");
    // The page should have a title or heading
    await expect(page).toHaveURL(/localhost:1420/);
    // Some visible content should render within the app
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
