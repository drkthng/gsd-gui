import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("light", "dark");
    localStorage.clear();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders without crashing", () => {
    render(<App />);
    // App should render the sidebar and main content area
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders the sidebar navigation", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: /main/i });
    expect(nav).toBeInTheDocument();
  });

  it("shows Chat as the default view", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /chat/i }),
    ).toBeInTheDocument();
  });
});
