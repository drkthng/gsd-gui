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

import { useSessions } from "./use-sessions";
import { useProjectStore } from "@/stores/project-store";
import type { SessionInfo, SavedProject } from "@/lib/types";

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

const makeSession = (overrides: Partial<SessionInfo> = {}): SessionInfo => ({
  id: "session-001",
  name: "Session 1",
  messageCount: 5,
  cost: 0.12,
  createdAt: "2024-01-01T10:00:00Z",
  lastActiveAt: "2024-01-01T11:00:00Z",
  preview: "First message preview",
  parentId: null,
  isActive: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.listSessions.mockResolvedValue([]);
    // Reset project store to no active project
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("returns empty sessions and no error when no project is selected", () => {
    const { result } = renderHook(() => useSessions());

    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.listSessions).not.toHaveBeenCalled();
  });

  it("fetches sessions when active project is set", async () => {
    const session = makeSession();
    mockClient.listSessions.mockResolvedValueOnce([session]);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useSessions());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockClient.listSessions).toHaveBeenCalledWith(project.path);
    expect(result.current.sessions).toEqual([session]);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading true while fetch is in progress", async () => {
    let resolve: (v: SessionInfo[]) => void;
    mockClient.listSessions.mockReturnValueOnce(
      new Promise<SessionInfo[]>((r) => {
        resolve = r;
      }),
    );

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useSessions());

    // Should be loading after hook mounts with an active project
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolve!([]);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("sets error string on fetch failure", async () => {
    mockClient.listSessions.mockRejectedValueOnce(new Error("IPC timeout"));

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useSessions());

    await waitFor(() => expect(result.current.error).toBe("IPC timeout"));

    expect(result.current.sessions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it("handles non-Error thrown values", async () => {
    mockClient.listSessions.mockRejectedValueOnce("raw string error");

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => useSessions());

    await waitFor(() => expect(result.current.error).toBe("raw string error"));
  });

  it("refetch re-calls listSessions", async () => {
    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const s1 = makeSession({ id: "session-001", name: "First" });
    const s2 = makeSession({ id: "session-002", name: "Second" });
    mockClient.listSessions
      .mockResolvedValueOnce([s1])
      .mockResolvedValueOnce([s2]);

    const { result } = renderHook(() => useSessions());

    // Wait for first fetch
    await waitFor(() => expect(result.current.sessions).toHaveLength(1));
    expect(result.current.sessions[0].id).toBe("session-001");

    // Trigger refetch
    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(result.current.sessions[0].id).toBe("session-002"),
    );
    expect(mockClient.listSessions).toHaveBeenCalledTimes(2);
  });

  it("refetch does nothing when no project is selected", async () => {
    const { result } = renderHook(() => useSessions());

    await act(async () => {
      result.current.refetch();
    });

    expect(mockClient.listSessions).not.toHaveBeenCalled();
  });

  it("clears sessions when active project becomes null", async () => {
    const project = makeProject();
    const session = makeSession();
    mockClient.listSessions.mockResolvedValueOnce([session]);

    useProjectStore.setState({ activeProject: project });
    const { result } = renderHook(() => useSessions());

    await waitFor(() => expect(result.current.sessions).toHaveLength(1));

    // Deselect project
    act(() => {
      useProjectStore.setState({ activeProject: null });
    });

    await waitFor(() => expect(result.current.sessions).toEqual([]));
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
