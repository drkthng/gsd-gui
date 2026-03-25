import { test, expect } from "./fixtures";

const shortcuts = [
  { key: "1", path: "/chat", label: "Chat" },
  { key: "2", path: "/projects", label: "Projects" },
  { key: "3", path: "/milestones", label: "Milestones" },
  { key: "4", path: "/timeline", label: "Timeline" },
  { key: "5", path: "/costs", label: "Costs" },
  { key: "6", path: "/settings", label: "Settings" },
  { key: "7", path: "/pro-tools", label: "Pro Tools" },
];

test.describe("Keyboard Shortcuts", () => {
  for (const s of shortcuts) {
    test(`Ctrl+${s.key} navigates to ${s.label}`, async ({ page }) => {
      // Start from a known state — wait for redirect to /chat
      await page.goto("/");
      await expect(page).toHaveURL(/\/chat/);
      // Focus the body to ensure shortcuts aren't captured by an input
      await page.locator("body").click();
      await page.keyboard.press(`Control+${s.key}`);
      await expect(page).toHaveURL(new RegExp(s.path), { timeout: 10_000 });
    });
  }
});
