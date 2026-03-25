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
    it("loads projects and sets them", async () => {
      const projects = [
        { id: "p1", name: "Project 1", path: "/p1" },
        { id: "p2", name: "Project 2", path: "/p2" },
      ];
      mockClient.listProjects.mockResolvedValueOnce(projects);

      const { loadProjects } = useProjectStore.getState();
      await loadProjects("/scan");

      expect(useProjectStore.getState().projects).toEqual(projects);
      expect(useProjectStore.getState().isLoading).toBe(false);
      expect(mockClient.listProjects).toHaveBeenCalledWith("/scan");
    });

    it("sets loading state during fetch", async () => {
      let resolvePromise: (v: unknown[]) => void;
      mockClient.listProjects.mockReturnValueOnce(
        new Promise((r) => { resolvePromise = r; })
      );

      const { loadProjects } = useProjectStore.getState();
      const promise = loadProjects("/scan");
      expect(useProjectStore.getState().isLoading).toBe(true);

      resolvePromise!([]);
      await promise;
      expect(useProjectStore.getState().isLoading).toBe(false);
    });

    it("sets error on failure", async () => {
      mockClient.listProjects.mockRejectedValueOnce(new Error("scan failed"));
      const { loadProjects } = useProjectStore.getState();
      await loadProjects("/bad");
      expect(useProjectStore.getState().error).toBe("scan failed");
      expect(useProjectStore.getState().isLoading).toBe(false);
    });
  });

  describe("selectProject", () => {
    it("sets active project", () => {
      const project = { id: "p1", name: "Project 1", path: "/p1" };
      const { selectProject } = useProjectStore.getState();
      selectProject(project);
      expect(useProjectStore.getState().activeProject).toEqual(project);
    });
  });

  describe("clearProjects", () => {
    it("resets projects and active project", () => {
      useProjectStore.setState({
        projects: [{ id: "p1", name: "P1", path: "/p1" }],
        activeProject: { id: "p1", name: "P1", path: "/p1" },
      });
      const { clearProjects } = useProjectStore.getState();
      clearProjects();
      expect(useProjectStore.getState().projects).toEqual([]);
      expect(useProjectStore.getState().activeProject).toBeNull();
    });
  });
});
