import { create } from "zustand";
import { createGsdClient } from "@/services/gsd-client";
import type { ProjectInfo } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectState {
  projects: ProjectInfo[];
  activeProject: ProjectInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: (scanPath: string) => Promise<void>;
  selectProject: (project: ProjectInfo) => void;
  clearProjects: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const client = createGsdClient();

export const useProjectStore = create<ProjectState>()((set) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,

  loadProjects: async (scanPath: string) => {
    set({ isLoading: true, error: null });
    try {
      const projects = await client.listProjects(scanPath);
      set({ projects, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  selectProject: (project: ProjectInfo) => {
    set({ activeProject: project });
  },

  clearProjects: () => {
    set({ projects: [], activeProject: null });
  },
}));
