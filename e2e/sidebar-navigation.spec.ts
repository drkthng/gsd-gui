import { test, expect } from "./fixtures";

const navItems = [
  { label: "Chat", path: "/chat" },
  { label: "Projects", path: "/projects" },
  { label: "Milestones", path: "/milestones" },
  { label: "Timeline", path: "/timeline" },
  { label: "Costs", path: "/costs" },
  { label: "Settings", path: "/settings" },
  { label: "Pro Tools", path: "/pro-tools" },
];

test.describe("Sidebar Navigation", () => {
  for (const item of navItems) {
    test(`navigates to ${item.label} (${item.path})`, async ({ page }) => {
      await page.goto("/");
      await page.getByRole("link", { name: item.label }).click();
      await expect(page).toHaveURL(new RegExp(item.path));
      await expect(page.locator("h1")).toContainText(item.label);
    });
  }
});
