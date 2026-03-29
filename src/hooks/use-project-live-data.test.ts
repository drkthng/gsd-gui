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
    updateProject: vi.fn(),
    listSessions: vi.fn().mockResolvedValue({ sessions: [], total: 0 }),
    readSessionMessages: vi.fn().mockResolvedValue([]),
    getGitBranch: vi.fn().mockResolvedValue(null),
    readPreferences: vi.fn().mockResolvedValue({}),
    writePreferences: vi.fn().mockResolvedValue(undefined),
    listActivity: vi.fn().mockResolvedValue([]),
    initProject: vi.fn().mockResolvedValue(undefined),
    detectProjectMetadata: vi.fn().mockResolvedValue({}),
    checkGsdVersion: vi.fn(),
    upgradeGsd: vi.fn(),
    onUpgradeProgress: vi.fn().mockResolvedValue(vi.fn()),
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

import { useProjectLiveData } from "./use-project-live-data";
import type { ActivityEntry, QuerySnapshot } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSnapshot = (overrides: Partial<QuerySnapshot> = {}): QuerySnapshot => ({
  currentMilestone: "M001",
  activeTasks: 2,
  totalCost: 1.23,
  ...overrides,
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

describe("useProjectLiveData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.queryState.mockResolvedValue(makeSnapshot());
    mockClient.listActivity.mockResolvedValue([]);
  });

  // (a) null path returns defaults immediately with no loading, no API calls
  it("returns default values immediately when projectPath is null", () => {
    const { result } = renderHook(() => useProjectLiveData(null));

    expect(result.current.currentMilestone).toBeNull();
    expect(result.current.totalCost).toBe(0);
    expect(result.current.lastActivity).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    expect(mockClient.queryState).not.toHaveBeenCalled();
    expect(mockClient.listActivity).not.toHaveBeenCalled();
  });

  // (b) successful fetch populates all three fields
  it("populates currentMilestone, totalCost, and lastActivity on success", async () => {
    const snapshot = makeSnapshot({ currentMilestone: "M003", totalCost: 4.56 });
    const entry = makeEntry({ timestamp: "2024-06-15T12:00:00Z" });

    mockClient.queryState.mockResolvedValueOnce(snapshot);
    mockClient.listActivity.mockResolvedValueOnce([entry]);

    const { result } = renderHook(() => useProjectLiveData("/projects/alpha"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockClient.queryState).toHaveBeenCalledWith("/projects/alpha");
    expect(mockClient.listActivity).toHaveBeenCalledWith("/projects/alpha");
    expect(result.current.currentMilestone).toBe("M003");
    expect(result.current.totalCost).toBe(4.56);
    expect(result.current.lastActivity).toBe("2024-06-15T12:00:00Z");
    expect(result.current.error).toBeNull();
  });

  // (c) listActivity empty → lastActivity null
  it("returns null lastActivity when listActivity returns an empty array", async () => {
    mockClient.queryState.mockResolvedValueOnce(makeSnapshot());
    mockClient.listActivity.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useProjectLiveData("/projects/beta"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.lastActivity).toBeNull();
  });

  // last activity is derived from most recent timestamp when multiple entries present
  it("picks the most recent timestamp when multiple activity entries are returned", async () => {
    const entries = [
      makeEntry({ id: "a1", timestamp: "2024-01-01T08:00:00Z" }),
      makeEntry({ id: "a2", timestamp: "2024-03-10T15:30:00Z" }),
      makeEntry({ id: "a3", timestamp: "2024-02-20T09:00:00Z" }),
    ];

    mockClient.queryState.mockResolvedValueOnce(makeSnapshot());
    mockClient.listActivity.mockResolvedValueOnce(entries);

    const { result } = renderHook(() => useProjectLiveData("/projects/gamma"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Most recent is 2024-03-10
    expect(result.current.lastActivity).toBe("2024-03-10T15:30:00Z");
  });

  // (d) queryState error sets error state
  it("sets error and resets values when queryState throws", async () => {
    mockClient.queryState.mockRejectedValueOnce(new Error("IPC failure"));
    mockClient.listActivity.mockResolvedValueOnce([makeEntry()]);

    const { result } = renderHook(() => useProjectLiveData("/projects/delta"));

    await waitFor(() => expect(result.current.error).toBe("IPC failure"));

    expect(result.current.currentMilestone).toBeNull();
    expect(result.current.totalCost).toBe(0);
    expect(result.current.lastActivity).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error when listActivity throws", async () => {
    mockClient.queryState.mockResolvedValueOnce(makeSnapshot());
    mockClient.listActivity.mockRejectedValueOnce(new Error("listActivity failed"));

    const { result } = renderHook(() => useProjectLiveData("/projects/epsilon"));

    await waitFor(() => expect(result.current.error).toBe("listActivity failed"));

    expect(result.current.isLoading).toBe(false);
  });

  it("handles non-Error thrown values as string", async () => {
    mockClient.queryState.mockRejectedValueOnce("raw error string");

    const { result } = renderHook(() => useProjectLiveData("/projects/zeta"));

    await waitFor(() => expect(result.current.error).toBe("raw error string"));
  });

  // (e) stale response is discarded when path changes before fetch completes
  it("discards stale response when projectPath changes before fetch resolves", async () => {
    const staleSnapshot = makeSnapshot({ currentMilestone: "M-STALE", totalCost: 999 });
    const freshSnapshot = makeSnapshot({ currentMilestone: "M-FRESH", totalCost: 1 });

    let resolveStale!: (v: QuerySnapshot) => void;

    mockClient.queryState
      .mockReturnValueOnce(
        new Promise<QuerySnapshot>((r) => {
          resolveStale = r;
        }),
      )
      .mockResolvedValueOnce(freshSnapshot);

    mockClient.listActivity.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ path }: { path: string }) => useProjectLiveData(path),
      { initialProps: { path: "/projects/path1" } },
    );

    // Switch to second path before first fetch resolves
    rerender({ path: "/projects/path2" });

    // Now resolve the stale first fetch
    await act(async () => {
      resolveStale(staleSnapshot);
    });

    // Wait for fresh data to arrive
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Stale response should have been discarded
    expect(result.current.currentMilestone).toBe("M-FRESH");
    expect(result.current.totalCost).toBe(1);
  });

  // resetting to null path resets state
  it("resets to defaults when projectPath changes from a path to null", async () => {
    const snapshot = makeSnapshot({ currentMilestone: "M002", totalCost: 2.22 });
    const entry = makeEntry({ timestamp: "2024-05-01T00:00:00Z" });

    mockClient.queryState.mockResolvedValueOnce(snapshot);
    mockClient.listActivity.mockResolvedValueOnce([entry]);

    const { result, rerender } = renderHook(
      ({ path }: { path: string | null }) => useProjectLiveData(path),
      { initialProps: { path: "/projects/eta" as string | null } },
    );

    await waitFor(() => expect(result.current.currentMilestone).toBe("M002"));

    act(() => {
      rerender({ path: null });
    });

    await waitFor(() => expect(result.current.currentMilestone).toBeNull());
    expect(result.current.totalCost).toBe(0);
    expect(result.current.lastActivity).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
