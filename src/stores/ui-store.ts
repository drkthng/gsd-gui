import { create } from "zustand";

type Theme = "dark" | "light" | "system";
type View =
  | "chat"
  | "projects"
  | "milestones"
  | "timeline"
  | "costs"
  | "settings"
  | "help";

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  activeView: View;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setActiveView: (view: View) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  theme: "system",
  sidebarOpen: true,
  activeView: "chat",
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveView: (activeView) => set({ activeView }),
}));

export type { Theme, View, UIState };
