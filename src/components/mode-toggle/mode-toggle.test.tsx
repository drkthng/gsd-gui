import { describe, expect, it, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { ModeToggle } from "./mode-toggle";

describe("ModeToggle", () => {
  beforeEach(() => {
    // Clear any theme class from previous tests
    document.documentElement.classList.remove("light", "dark");
    localStorage.clear();
  });

  it("renders a button with accessible label 'Toggle theme'", () => {
    renderWithProviders(<ModeToggle />);
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("opens a dropdown menu when the trigger button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModeToggle />);
    const trigger = screen.getByRole("button", { name: /toggle theme/i });
    await user.click(trigger);
    // Radix DropdownMenu renders menu items with role="menuitem"
    expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument();
  });

  it("dropdown contains exactly 3 items: Light, Dark, System", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Light");
    expect(items[1]).toHaveTextContent("Dark");
    expect(items[2]).toHaveTextContent("System");
  });

  it("clicking 'Dark' applies dark theme to document root", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /dark/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("gsd-gui-theme-test")).toBe("dark");
  });

  it("clicking 'Light' applies light theme to document root", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /light/i }));
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("gsd-gui-theme-test")).toBe("light");
  });

  it("clicking 'System' sets system theme and persists to localStorage", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ModeToggle />);
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    await user.click(screen.getByRole("menuitem", { name: /system/i }));
    expect(localStorage.getItem("gsd-gui-theme-test")).toBe("system");
    // System resolves to light (matchMedia mock returns matches: false for prefers-color-scheme: dark)
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
