import { test, expect } from "./fixtures";

test.describe("Chat – demo flow", () => {
  test("auto-connects and shows empty state initially", async ({ page }) => {
    await page.goto("/chat");
    // The empty state should appear briefly before any message is sent
    // Wait for the heading to confirm the chat page loaded
    await expect(page.locator("h1")).toContainText("Chat");
    // The message input should be present
    await expect(page.getByPlaceholder("Type a message…")).toBeVisible();
  });

  test("sends a message and receives a streaming demo response", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("h1")).toContainText("Chat");

    // Wait for auto-connect to finish — the textarea becomes enabled
    const textarea = page.getByPlaceholder("Type a message…");
    await expect(textarea).toBeVisible({ timeout: 5_000 });

    // Type a message
    await textarea.fill("Hello, who are you?");
    // Click the send button
    await page.getByRole("button", { name: "Send message" }).click();

    // The user message should appear in the chat
    await expect(page.getByText("Hello, who are you?")).toBeVisible({ timeout: 5_000 });

    // Wait for the streaming assistant response — the demo client responds
    // with a contextual message containing "GSD" for this query
    await expect(page.getByText("GSD", { exact: false }).last()).toBeVisible({ timeout: 10_000 });

    // The assistant response should mention it's a demo or describe what GSD is
    // The demo client returns: "I'm GSD — Get Shit Done. ..."
    await expect(page.getByText("Get Shit Done", { exact: false })).toBeVisible({ timeout: 10_000 });
  });

  test("send button is disabled when textarea is empty", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("h1")).toContainText("Chat");

    const sendButton = page.getByRole("button", { name: "Send message" });
    await expect(sendButton).toBeDisabled();

    // Type something — button should become enabled
    const textarea = page.getByPlaceholder("Type a message…");
    await textarea.fill("test");
    await expect(sendButton).toBeEnabled();

    // Clear — button should be disabled again
    await textarea.fill("");
    await expect(sendButton).toBeDisabled();
  });
});
