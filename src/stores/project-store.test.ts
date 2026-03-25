import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn().mockResolvedValue([]),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    getSavedProjects: vi.fn().mockResolvedValue([]),
    addProject: vi.fn(),
    removeProject: vi.fn(),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

import { useProjectStore } from "./project-store";
import type { SavedProject } from "@/lib/types";

const makeProject = (id: string, name: string): SavedProject => ({
  id,
  name,
  path: `/projects/${name}`,
  description: null,
  addedAt: "1234567890",
});

describe("project-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  describe("initial state", () => {
    it("has correct defaults", () => {
      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.activeProject).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("loadProjects", () => {
    it("loads saved projects from registry", async () => {
      const projects = [makeProject("p1", "alpha"), makeProject("p2", "beta")];
      mockClient.getSavedProjects.mockResolvedValueOnce(projects);

      await useProjectStore.getState().loadProjects();

      expect(useProjectStore.getState().projects).toEqual(projects);
      expect(useProjectStore.getState().isLoading).toBe(false);
      expect(mockClient.getSavedProjects).toHaveBeenCalled();
    });

    it("sets loading state during fetch", async () => {
      let resolve: (v: SavedProject[]) => void;
      mockClient.getSavedProjects.mockReturnValueOnce(
        new Promise<SavedProject[]>((r) => { resolve = r; }),
      );

      const promise = useProjectStore.getState().loadProjects();
      expect(useProjectStore.getState().isLoading).toBe(true);

      resolve!([]);
      await promise;
      expect(useProjectStore.getState().isLoading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockClient.getSavedProjects.mockRejectedValueOnce(new Error("disk error"));
      await useProjectStore.getState().loadProjects();
      expect(useProjectStore.getState().error).toBe("disk error");
      expect(useProjectStore.getState().isLoading).toBe(false);
    });
  });

  describe("addProject", () => {
    it("adds a project and reloads the list", async () => {
      const saved = makeProject("p1", "new-project");
      mockClient.addProject.mockResolvedValueOnce(saved);
      mockClient.getSavedProjects.mockResolvedValueOnce([saved]);

      const result = await useProjectStore.getState().addProject("/projects/new-project");

      expect(result).toEqual(saved);
      expect(mockClient.addProject).toHaveBeenCalledWith("/projects/new-project", undefined);
      expect(useProjectStore.getState().projects).toEqual([saved]);
    });

    it("passes description when provided", async () => {
      const saved = makeProject("p1", "described");
      mockClient.addProject.mockResolvedValueOnce(saved);
      mockClient.getSavedProjects.mockResolvedValueOnce([saved]);

      await useProjectStore.getState().addProject("/path", "My project");
      expect(mockClient.addProject).toHaveBeenCalledWith("/path", "My project");
    });

    it("sets error and throws on failure", async () => {
      mockClient.addProject.mockRejectedValueOnce(new Error("no .gsd/ found"));

      await expect(
        useProjectStore.getState().addProject("/bad"),
      ).rejects.toThrow("no .gsd/ found");

      expect(useProjectStore.getState().error).toBe("no .gsd/ found");
    });
  });

  describe("removeProject", () => {
    it("removes a project and reloads the list", async () => {
      const p1 = makeProject("p1", "alpha");
      const p2 = makeProject("p2", "beta");
      useProjectStore.setState({ projects: [p1, p2], activeProject: p1 });

      mockClient.removeProject.mockResolvedValueOnce(undefined);
      mockClient.getSavedProjects.mockResolvedValueOnce([p2]);

      await useProjectStore.getState().removeProject("p1");

      expect(mockClient.removeProject).toHaveBeenCalledWith("p1");
      expect(useProjectStore.getState().projects).toEqual([p2]);
      // Active project was removed, so it should be cleared
      expect(useProjectStore.getState().activeProject).toBeNull();
    });

    it("preserves activeProject if a different project is removed", async () => {
      const p1 = makeProject("p1", "alpha");
      const p2 = makeProject("p2", "beta");
      useProjectStore.setState({ projects: [p1, p2], activeProject: p1 });

      mockClient.removeProject.mockResolvedValueOnce(undefined);
      mockClient.getSavedProjects.mockResolvedValueOnce([p1]);

      await useProjectStore.getState().removeProject("p2");

      expect(useProjectStore.getState().activeProject).toEqual(p1);
    });
  });

  describe("selectProject", () => {
    it("sets active project", () => {
      const project = makeProject("p1", "alpha");
      useProjectStore.getState().selectProject(project);
      expect(useProjectStore.getState().activeProject).toEqual(project);
    });
  });

  describe("clearError", () => {
    it("clears the error state", () => {
      useProjectStore.setState({ error: "something broke" });
      useProjectStore.getState().clearError();
      expect(useProjectStore.getState().error).toBeNull();
    });
  });
});
