import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, within } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "./app-shell";
import { appRoutes, type RouteEntry } from "@/router";
import { Navigate } from "react-router-dom";
import { useUIStore } from "@/stores/ui-store";

// Helper to render AppShell with routes (it expects child routes via Outlet)
function renderAppShell(initialRoute = "/chat") {
  return renderWithProviders(
    <Routes>
      <Route element={<AppShell />}>
        {appRoutes.map((route: RouteEntry, i: number) =>
          "index" in route ? (
            <Route key={i} index element={<Navigate to={route.to} replace />} />
          ) : (
            <Route key={i} path={route.path} element={route.element} />
          ),
        )}
      </Route>
    </Routes>,
    { initialRoute },
  );
}

describe("AppShell", () => {
  beforeEach(() => {
    // Reset Zustand store between tests
    useUIStore.setState({ activeView: "chat", sidebarOpen: true });
  });

  const expectedLabels = [
    "Chat",
    "Projects",
    "Milestones",
    "Timeline",
    "Costs",
    "Settings",
    "Help",
  ];

  it("renders 7 navigation items with correct labels", () => {
    renderAppShell();
    const sidebar = screen.getByRole("navigation", { name: /main/i });
    for (const label of expectedLabels) {
      expect(within(sidebar).getByText(label)).toBeInTheDocument();
    }
  });

  it("renders the ModeToggle in the sidebar footer", () => {
    renderAppShell();
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("renders the StatusBar", () => {
    renderAppShell();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("shows the Chat page by default at /chat", () => {
    renderAppShell("/chat");
    expect(
      screen.getByRole("heading", { level: 1, name: /chat/i }),
    ).toBeInTheDocument();
  });

  it("navigates to Projects page when clicking Projects nav item", async () => {
    const user = userEvent.setup();
    renderAppShell("/chat");
    const sidebar = screen.getByRole("navigation", { name: /main/i });
    await user.click(within(sidebar).getByText("Projects"));
    expect(
      screen.getByRole("heading", { level: 1, name: /projects/i }),
    ).toBeInTheDocument();
  });

  it("navigates to each page from sidebar", async () => {
    const user = userEvent.setup();
    const routeMap: Record<string, RegExp> = {
      Chat: /chat/i,
      Projects: /projects/i,
      Milestones: /milestones/i,
      Timeline: /timeline/i,
      Costs: /costs/i,
      Settings: /settings/i,
      Help: /help/i,
    };
    renderAppShell("/chat");
    for (const [label, headingPattern] of Object.entries(routeMap)) {
      const sidebar = screen.getByRole("navigation", { name: /main/i });
      await user.click(within(sidebar).getByText(label));
      expect(
        screen.getByRole("heading", { level: 1, name: headingPattern }),
      ).toBeInTheDocument();
    }
  });

  it("syncs activeView in Zustand store when navigating", async () => {
    const user = userEvent.setup();
    renderAppShell("/chat");
    expect(useUIStore.getState().activeView).toBe("chat");
    const sidebar = screen.getByRole("navigation", { name: /main/i });
    await user.click(within(sidebar).getByText("Settings"));
    expect(useUIStore.getState().activeView).toBe("settings");
  });

  it("renders sidebar in mobile mode when useIsMobile returns true", () => {
    // The sidebar component uses useIsMobile which reads window.innerWidth
    // When mobile, the Sidebar renders as a Sheet — verify it doesn't crash
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 600,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 767px)" || query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    renderAppShell("/chat");
    // In mobile mode, the sidebar content is inside a Sheet (not visible by default)
    // but the app should still render without crashing and show the main content
    expect(
      screen.getByRole("heading", { level: 1, name: /chat/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
