import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock GSD client (K-M002-05: vi.hoisted required for module-scope client)
// ---------------------------------------------------------------------------
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn().mockResolvedValue([]),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    parseProjectMilestones: vi.fn().mockResolvedValue([]),
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

import { useMilestoneData } from "./use-milestone-data";
import { useProjectStore } from "@/stores/project-store";
import type { MilestoneInfo, SavedProject } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeProject = (id = "p1", name = "alpha"): SavedProject => ({
  id,
  name,
  path: `/projects/${name}`,
  description: null,
  addedAt: "1234567890",
});

const makeMilestone = (overrides: Partial<MilestoneInfo> = {}): MilestoneInfo => ({
  id: "M001",
  title: "Test Milestone",
  status: "in-progress",
  cost: 0,
  progress: 50,
  slices: [
    {
      id: "S01",
      title: "Slice One",
      status: "done",
      risk: "low",
      cost: 0,
      progress: 100,
      tasks: [
        { id: "T01", title: "Task A", status: "done", cost: 1.5, duration: "1h" },
      ],
      depends: [],
    },
  ],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useMilestoneData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.parseProjectMilestones.mockResolvedValue([]);
    // Reset project store to no active project
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("returns empty arrays and no error when no project is selected", () => {
    const { result } = renderHook(() => useMilestoneData());

    expect(result.current.milestones).toEqual([]);
    expect(result.current.costData.totalCost).toBe(0);
    expect(result.current.costData.byPhase).toEqual([]);
    expect(result.current.costData.bySlice).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.parseProjectMilestones).not.toHaveBeenCalled();
  });

  it("fetches milestones when active project is set", async () => {
    const milestone = makeMilestone();
    mockClient.parseProjectMilestones.mockResolvedValueOnce([milestone]);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useMilestoneData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockClient.parseProjectMilestones).toHaveBeenCalledWith(project.path);
    expect(result.current.milestones).toEqual([milestone]);
    expect(result.current.costData.totalCost).toBeCloseTo(1.5);
    expect(result.current.costData.byPhase).toHaveLength(1);
    expect(result.current.costData.bySlice).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading while fetch is in progress", async () => {
    let resolve: (v: MilestoneInfo[]) => void;
    mockClient.parseProjectMilestones.mockReturnValueOnce(
      new Promise<MilestoneInfo[]>((r) => { resolve = r; }),
    );

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useMilestoneData());

    // Should be loading after hook mounts with an active project
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => { resolve!([]); });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("sets error string on fetch failure", async () => {
    mockClient.parseProjectMilestones.mockRejectedValueOnce(
      new Error("IPC timeout"),
    );

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useMilestoneData());

    await waitFor(() => expect(result.current.error).toBe("IPC timeout"));

    expect(result.current.milestones).toEqual([]);
    expect(result.current.costData.totalCost).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles non-Error thrown values", async () => {
    mockClient.parseProjectMilestones.mockRejectedValueOnce("raw string error");

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useMilestoneData());

    await waitFor(() => expect(result.current.error).toBe("raw string error"));
  });

  it("refetch re-calls parseProjectMilestones", async () => {
    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const m1 = makeMilestone({ id: "M001", title: "First" });
    const m2 = makeMilestone({ id: "M002", title: "Second" });
    mockClient.parseProjectMilestones
      .mockResolvedValueOnce([m1])
      .mockResolvedValueOnce([m2]);

    const { result } = renderHook(() => useMilestoneData());

    // Wait for first fetch
    await waitFor(() => expect(result.current.milestones).toHaveLength(1));
    expect(result.current.milestones[0].id).toBe("M001");

    // Trigger refetch
    await act(async () => { result.current.refetch(); });

    await waitFor(() => expect(result.current.milestones[0].id).toBe("M002"));
    expect(mockClient.parseProjectMilestones).toHaveBeenCalledTimes(2);
  });

  it("refetch does nothing when no project is selected", async () => {
    const { result } = renderHook(() => useMilestoneData());

    await act(async () => { result.current.refetch(); });

    expect(mockClient.parseProjectMilestones).not.toHaveBeenCalled();
  });

  it("re-fetches when active project changes", async () => {
    const projectA = makeProject("p1", "alpha");
    const projectB = makeProject("p2", "beta");

    const mA = makeMilestone({ id: "M001", title: "Alpha milestone" });
    const mB = makeMilestone({ id: "M002", title: "Beta milestone" });

    mockClient.parseProjectMilestones
      .mockResolvedValueOnce([mA])
      .mockResolvedValueOnce([mB]);

    useProjectStore.setState({ activeProject: projectA });
    const { result } = renderHook(() => useMilestoneData());

    await waitFor(() => expect(result.current.milestones[0]?.id).toBe("M001"));

    // Switch project
    act(() => { useProjectStore.setState({ activeProject: projectB }); });

    await waitFor(() => expect(result.current.milestones[0]?.id).toBe("M002"));

    expect(mockClient.parseProjectMilestones).toHaveBeenCalledWith(projectA.path);
    expect(mockClient.parseProjectMilestones).toHaveBeenCalledWith(projectB.path);
  });

  it("clears data when active project becomes null", async () => {
    const project = makeProject();
    const milestone = makeMilestone();
    mockClient.parseProjectMilestones.mockResolvedValueOnce([milestone]);

    useProjectStore.setState({ activeProject: project });
    const { result } = renderHook(() => useMilestoneData());

    await waitFor(() => expect(result.current.milestones).toHaveLength(1));

    // Deselect project
    act(() => { useProjectStore.setState({ activeProject: null }); });

    await waitFor(() => expect(result.current.milestones).toEqual([]));
    expect(result.current.costData.totalCost).toBe(0);
    expect(result.current.error).toBeNull();
  });
});
