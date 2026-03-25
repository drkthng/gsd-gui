import { test as base, expect } from "@playwright/test";

/**
 * Shared E2E test fixtures for GSD UI.
 * Extend this file with custom fixtures as needed.
 */
export const test = base.extend<{
  /** Navigate to the app root and wait for the shell to render */
  appReady: void;
}>({
  appReady: async ({ page }, use) => {
    await page.goto("/");
    // Wait for the sidebar to confirm the app shell rendered
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10_000 }).catch(() => {
      // Fallback: wait for any nav element
      return page.waitForSelector("nav", { timeout: 5_000 });
    });
    await use();
  },
});

export { expect };
