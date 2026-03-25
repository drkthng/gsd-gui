import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

// Helper component that exposes useTheme() values for testing
function ThemeConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("system")}>Set System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Reset DOM and localStorage between tests
    document.documentElement.classList.remove("light", "dark");
    localStorage.clear();

    // Mock matchMedia for system theme detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
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

  it("renders its children", () => {
    render(
      <ThemeProvider>
        <span>child content</span>
      </ThemeProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("useTheme() returns an object with theme and setTheme", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme")).toBeInTheDocument();
    expect(screen.getByText("Set Dark")).toBeInTheDocument();
  });

  it('defaults to "system" when no localStorage value exists', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("system");
  });

  it('setTheme("dark") updates the theme context value and applies class', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      screen.getByText("Set Dark").click();
    });

    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
  });

  it('setTheme("light") updates the theme context value and applies class', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      screen.getByText("Set Light").click();
    });

    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", () => {
    render(
      <ThemeProvider storageKey="gsd-gui-theme">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      screen.getByText("Set Dark").click();
    });

    expect(localStorage.getItem("gsd-gui-theme")).toBe("dark");
  });

  it("reads initial theme from localStorage", () => {
    localStorage.setItem("gsd-gui-theme", "light");

    render(
      <ThemeProvider storageKey="gsd-gui-theme">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it('applies system theme class when theme is "system"', () => {
    // matchMedia mock returns true for prefers-color-scheme: dark
    render(
      <ThemeProvider defaultTheme="system">
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme").textContent).toBe("system");
    // System preference is "dark" per mock
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes previous theme class when switching themes", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      screen.getByText("Set Dark").click();
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      screen.getByText("Set Light").click();
    });
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("useTheme outside provider", () => {
  it("throws an error when used outside ThemeProvider", () => {
    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ThemeConsumer />)).toThrow(
      "useTheme must be used within a ThemeProvider",
    );

    consoleSpy.mockRestore();
  });
});
