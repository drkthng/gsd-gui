import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { appRoutes, type AppRoute, type IndexRedirect } from "@/router";
import { Navigate } from "react-router-dom";

/** Helper: render routes at a given path inside ThemeProvider + MemoryRouter */
function renderAtPath(path: string) {
  return render(
    <ThemeProvider defaultTheme="system" storageKey="gsd-ui-theme-test">
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          {appRoutes.map((route) =>
            "index" in route ? (
              <Route
                key="index"
                index
                element={<Navigate to={(route as IndexRedirect).to} replace />}
              />
            ) : (
              <Route
                key={(route as AppRoute).path}
                path={(route as AppRoute).path}
                element={(route as AppRoute).element}
              />
            ),
          )}
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("Router config", () => {
  const routeTests = [
    { path: "/chat", heading: /chat/i },
    { path: "/projects", heading: /projects/i },
    { path: "/milestones", heading: /milestones/i },
    { path: "/timeline", heading: /timeline/i },
    { path: "/costs", heading: /costs/i },
    { path: "/settings", heading: /settings/i },
    { path: "/help", heading: /help/i },
  ] as const;

  for (const { path, heading } of routeTests) {
    it(`${path} renders the correct page`, () => {
      renderAtPath(path);
      expect(
        screen.getByRole("heading", { level: 1, name: heading }),
      ).toBeInTheDocument();
    });
  }

  it("root path / redirects to /chat", () => {
    renderAtPath("/");
    expect(
      screen.getByRole("heading", { name: /chat/i }),
    ).toBeInTheDocument();
  });

  it("exports exactly 8 route entries (7 pages + 1 index redirect)", () => {
    expect(appRoutes).toHaveLength(8);
  });
});
