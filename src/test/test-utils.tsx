import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { beforeEach, vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Mock matchMedia for jsdom — required by ThemeProvider (K009).
 * Call this in a beforeEach block or at module scope before rendering.
 */
export function setupMatchMediaMock() {
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
}

// Auto-setup matchMedia mock before each test in any file that imports this module
beforeEach(() => {
  setupMatchMediaMock();
});

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  initialRoute?: string;
  routes?: MemoryRouterProps["initialEntries"];
}

/**
 * Renders a component wrapped in ThemeProvider + MemoryRouter.
 * - `initialRoute`: shorthand for a single initial entry (default: "/")
 * - `routes`: full initialEntries array for MemoryRouter (overrides initialRoute)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { initialRoute = "/", routes, ...options }: RenderWithProvidersOptions = {},
) {
  const initialEntries = routes ?? [initialRoute];

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider defaultTheme="system" storageKey="gsd-ui-theme-test">
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing-library for convenience
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
