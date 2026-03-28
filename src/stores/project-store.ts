import { create } from "zustand";
import { createGsdClient } from "@/services/gsd-client";
import type { SavedProject } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectState {
  projects: SavedProject[];
  activeProject: SavedProject | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  addProject: (projectPath: string, description?: string) => Promise<SavedProject>;
  removeProject: (projectId: string) => Promise<void>;
  updateProject: (projectId: string, name: string, description: string) => Promise<void>;
  selectProject: (project: SavedProject) => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const client = createGsdClient();

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  activeProject: null,
  isLoading: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await client.getSavedProjects();
      set({ projects, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  addProject: async (projectPath: string, description?: string) => {
    set({ error: null });
    try {
      const saved = await client.addProject(projectPath, description);
      // Reload the full list to stay in sync
      const projects = await client.getSavedProjects();
      set({ projects });
      return saved;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ error: message });
      throw new Error(message);
    }
  },

  removeProject: async (projectId: string) => {
    set({ error: null });
    try {
      await client.removeProject(projectId);
      const { activeProject } = get();
      const projects = await client.getSavedProjects();
      set({
        projects,
        activeProject:
          activeProject?.id === projectId ? null : activeProject,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  selectProject: (project: SavedProject) => {
    set({ activeProject: project });
  },

  updateProject: async (projectId: string, name: string, description: string) => {
    set({ error: null });
    try {
      const updated = await client.updateProject(projectId, name, description);
      const projects = await client.getSavedProjects();
      const { activeProject } = get();
      set({
        projects,
        activeProject: activeProject?.id === projectId ? updated : activeProject,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
