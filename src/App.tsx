import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { appRoutes, type RouteEntry } from "@/router";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="gsd-gui-theme">
          <Routes>
            <Route element={<AppShell />}>
              {appRoutes.map((route: RouteEntry, i: number) =>
                "index" in route ? (
                  <Route
                    key={i}
                    index
                    element={<Navigate to={route.to} replace />}
                  />
                ) : (
                  <Route key={i} path={route.path} element={route.element} />
                ),
              )}
            </Route>
          </Routes>
        </ThemeProvider>
        <Toaster richColors closeButton position="bottom-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
