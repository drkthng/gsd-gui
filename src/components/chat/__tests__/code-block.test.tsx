import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CodeBlock } from "../code-block";

// ---------------------------------------------------------------------------
// Mock shiki so tests don't need real network/wasm loading.
// The factory returns a Promise so dynamic import() is respected.
// ---------------------------------------------------------------------------
const MOCK_HTML = '<pre class="shiki"><code><span>const x = 1;</span></code></pre>';

// Mutable handle so individual tests can swap the implementation.
let codeToHtmlImpl: (code: string, opts: unknown) => Promise<string> = async () =>
  MOCK_HTML;

vi.mock("shiki", () => ({
  codeToHtml: (...args: [string, unknown]) => codeToHtmlImpl(...args),
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  // Reset to the happy-path implementation before each test.
  codeToHtmlImpl = async () => MOCK_HTML;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CodeBlock", () => {
  it("Test 1: renders CSS fallback before shiki resolves", () => {
    // Make shiki never resolve during this synchronous check.
    codeToHtmlImpl = () => new Promise(() => {});

    render(<CodeBlock language="typescript" code="const x = 1;" />);

    // The fallback pre/code should be present immediately.
    const code = screen.getByText("const x = 1;");
    expect(code.tagName).toBe("CODE");
    expect(code.className).toBe("language-typescript");
    expect(code.closest("pre")).toBeTruthy();
  });

  it("Test 2: renders highlighted HTML after shiki resolves", async () => {
    render(<CodeBlock language="typescript" code="const x = 1;" />);

    // Wait for shiki to resolve and the highlighted div to appear.
    await waitFor(() => {
      const container = document.querySelector(".shiki-wrapper");
      expect(container).toBeTruthy();
    });

    const wrapper = document.querySelector(".shiki-wrapper") as HTMLDivElement;
    expect(wrapper.innerHTML).toBe(MOCK_HTML);
    // The un-highlighted fallback code element should be gone (shiki HTML itself
    // may contain <pre class="shiki">, so we check for the fallback class).
    expect(document.querySelector("code.language-typescript")).toBeNull();
  });

  it("Test 3: inline code skips shiki and renders plain <code> tag", () => {
    render(<CodeBlock language="typescript" code="const x = 1;" inline />);

    const code = screen.getByText("const x = 1;");
    expect(code.tagName).toBe("CODE");
    expect(code.className).toBe("inline-code");
    // shiki should never have been called
    expect(document.querySelector(".shiki-wrapper")).toBeNull();
    expect(document.querySelector("pre")).toBeNull();
  });

  it("Test 4: unknown language ('brainfuck') falls back gracefully without throwing", async () => {
    // brainfuck is not a shiki-supported language; simulate the reject.
    codeToHtmlImpl = async (_code, opts) => {
      const { lang } = opts as { lang: string };
      if (lang === "brainfuck") throw new Error("Unknown language: brainfuck");
      return MOCK_HTML;
    };

    expect(() =>
      render(<CodeBlock language="brainfuck" code="+++++++." />),
    ).not.toThrow();

    // After the async effect settles the fallback should still be visible.
    await waitFor(() => {
      const code = screen.getByText("+++++++.");
      expect(code.tagName).toBe("CODE");
      expect(code.className).toBe("language-brainfuck");
    });

    // No highlighted output should have appeared.
    expect(document.querySelector(".shiki-wrapper")).toBeNull();
  });

  it("Test 5: shiki error path — codeToHtml rejects → CSS fallback remains visible", async () => {
    codeToHtmlImpl = async () => {
      throw new Error("shiki exploded");
    };

    render(<CodeBlock language="ts" code="let y = 2;" />);

    // Wait a tick for the rejected promise to settle.
    await waitFor(() => {
      const code = screen.getByText("let y = 2;");
      expect(code.tagName).toBe("CODE");
    });

    // Fallback must still be there, highlighted wrapper must not appear.
    const code = screen.getByText("let y = 2;");
    expect(code.className).toBe("language-ts");
    expect(document.querySelector(".shiki-wrapper")).toBeNull();
  });
});
