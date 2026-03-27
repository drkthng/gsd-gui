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
    listSessions: vi.fn().mockResolvedValue([]),
    readPreferences: vi.fn().mockResolvedValue({}),
    writePreferences: vi.fn().mockResolvedValue(undefined),
    listActivity: vi.fn().mockResolvedValue([]),
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

import { useActivity } from "./use-activity";
import { useProjectStore } from "@/stores/project-store";
import type { ActivityEntry, SavedProject } from "@/lib/types";

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

const makeEntry = (overrides: Partial<ActivityEntry> = {}): ActivityEntry => ({
  id: "activity-001",
  action: "execute-task",
  milestoneId: "M001",
  sliceId: "S01",
  taskId: "T01",
  timestamp: "2024-01-01T10:00:00Z",
  messageCount: 5,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.listActivity.mockResolvedValue([]);
    // Reset project store to no active project
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("returns empty activity and no error when no project is selected", () => {
    const { result } = renderHook(() => useActivity());

    expect(result.current.activity).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.listActivity).not.toHaveBeenCalled();
  });

  it("fetches activity when active project is set", async () => {
    const entry = makeEntry();
    mockClient.listActivity.mockResolvedValueOnce([entry]);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useActivity());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockClient.listActivity).toHaveBeenCalledWith(project.path);
    expect(result.current.activity).toEqual([entry]);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading true while fetch is in progress", async () => {
    let resolve: (v: ActivityEntry[]) => void;
    mockClient.listActivity.mockReturnValueOnce(
      new Promise<ActivityEntry[]>((r) => {
        resolve = r;
      }),
    );

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useActivity());

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolve!([]);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("sets error string on fetch failure and clears activity", async () => {
    mockClient.listActivity.mockRejectedValueOnce(new Error("IPC timeout"));

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useActivity());

    await waitFor(() => expect(result.current.error).toBe("IPC timeout"));

    expect(result.current.activity).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles non-Error thrown values", async () => {
    mockClient.listActivity.mockRejectedValueOnce("raw string error");

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useActivity());

    await waitFor(() => expect(result.current.error).toBe("raw string error"));
  });

  it("refetch re-calls listActivity", async () => {
    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const e1 = makeEntry({ id: "activity-001", action: "plan-slice" });
    const e2 = makeEntry({ id: "activity-002", action: "execute-task" });
    mockClient.listActivity
      .mockResolvedValueOnce([e1])
      .mockResolvedValueOnce([e2]);

    const { result } = renderHook(() => useActivity());

    await waitFor(() => expect(result.current.activity).toHaveLength(1));
    expect(result.current.activity[0].id).toBe("activity-001");

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(result.current.activity[0].id).toBe("activity-002"),
    );
    expect(mockClient.listActivity).toHaveBeenCalledTimes(2);
  });

  it("refetch does nothing when no project is selected", async () => {
    const { result } = renderHook(() => useActivity());

    await act(async () => {
      result.current.refetch();
    });

    expect(mockClient.listActivity).not.toHaveBeenCalled();
  });

  it("clears activity when active project becomes null", async () => {
    const project = makeProject();
    const entry = makeEntry();
    mockClient.listActivity.mockResolvedValueOnce([entry]);

    useProjectStore.setState({ activeProject: project });
    const { result } = renderHook(() => useActivity());

    await waitFor(() => expect(result.current.activity).toHaveLength(1));

    act(() => {
      useProjectStore.setState({ activeProject: null });
    });

    await waitFor(() => expect(result.current.activity).toEqual([]));
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("discards stale fetch when project changes mid-flight", async () => {
    const project1 = makeProject("p1", "alpha");
    const project2 = makeProject("p2", "beta");

    const staleEntry = makeEntry({ id: "stale", action: "stale-action" });
    const freshEntry = makeEntry({ id: "fresh", action: "fresh-action" });

    let resolveStale: (v: ActivityEntry[]) => void;
    mockClient.listActivity
      .mockReturnValueOnce(
        new Promise<ActivityEntry[]>((r) => {
          resolveStale = r;
        }),
      )
      .mockResolvedValueOnce([freshEntry]);

    useProjectStore.setState({ activeProject: project1 });
    const { result } = renderHook(() => useActivity());

    // Switch project before first fetch resolves
    act(() => {
      useProjectStore.setState({ activeProject: project2 });
    });

    // Resolve the stale fetch after project switch
    await act(async () => {
      resolveStale!([staleEntry]);
    });

    // Should show fresh data, not stale
    await waitFor(() =>
      expect(result.current.activity[0]?.id).toBe("fresh"),
    );
  });
});
