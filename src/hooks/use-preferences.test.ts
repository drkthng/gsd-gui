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

import { usePreferences } from "./use-preferences";
import { useProjectStore } from "@/stores/project-store";
import type { PreferencesData, SavedProject } from "@/lib/types";

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

const makePrefs = (overrides: Partial<PreferencesData> = {}): PreferencesData => ({
  version: 1,
  mode: "auto",
  git: { isolation: "worktree", auto_push: false },
  custom_instructions: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePreferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.readPreferences.mockResolvedValue({});
    mockClient.writePreferences.mockResolvedValue(undefined);
    // Reset project store to no active project
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("returns null preferences and no error when no project is selected", () => {
    const { result } = renderHook(() => usePreferences());

    expect(result.current.preferences).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockClient.readPreferences).not.toHaveBeenCalled();
  });

  it("fetches preferences when active project is set", async () => {
    const prefs = makePrefs({ mode: "manual" });
    mockClient.readPreferences.mockResolvedValueOnce(prefs);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockClient.readPreferences).toHaveBeenCalledWith(project.path);
    expect(result.current.preferences).toEqual(prefs);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading true while fetch is in progress", async () => {
    let resolve: (v: PreferencesData) => void;
    mockClient.readPreferences.mockReturnValueOnce(
      new Promise<PreferencesData>((r) => {
        resolve = r;
      }),
    );

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolve!(makePrefs());
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("sets error string on fetch failure", async () => {
    mockClient.readPreferences.mockRejectedValueOnce(new Error("IPC timeout"));

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.error).toBe("IPC timeout"));

    expect(result.current.preferences).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("handles non-Error thrown values on fetch", async () => {
    mockClient.readPreferences.mockRejectedValueOnce("raw string error");

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.error).toBe("raw string error"));
  });

  it("savePreferences calls writePreferences and refreshes state", async () => {
    const initial = makePrefs({ mode: "auto" });
    const updated = makePrefs({ mode: "manual" });

    // First fetch returns initial, second (after save) returns updated
    mockClient.readPreferences
      .mockResolvedValueOnce(initial)
      .mockResolvedValueOnce(updated);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.preferences).toEqual(initial));

    await act(async () => {
      await result.current.savePreferences(updated);
    });

    expect(mockClient.writePreferences).toHaveBeenCalledWith(project.path, updated);
    expect(mockClient.readPreferences).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(result.current.preferences).toEqual(updated),
    );
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on save failure", async () => {
    const prefs = makePrefs();
    mockClient.readPreferences.mockResolvedValue(prefs);
    mockClient.writePreferences.mockRejectedValueOnce(new Error("write failed"));

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.preferences).toEqual(prefs));

    await act(async () => {
      await result.current.savePreferences({ mode: "bad" });
    });

    await waitFor(() => expect(result.current.error).toBe("write failed"));
    expect(result.current.isSaving).toBe(false);
  });

  it("savePreferences does nothing when no project is selected", async () => {
    const { result } = renderHook(() => usePreferences());

    await act(async () => {
      await result.current.savePreferences({ mode: "auto" });
    });

    expect(mockClient.writePreferences).not.toHaveBeenCalled();
  });

  it("refetch re-calls readPreferences", async () => {
    const prefs1 = makePrefs({ mode: "auto" });
    const prefs2 = makePrefs({ mode: "manual" });

    mockClient.readPreferences
      .mockResolvedValueOnce(prefs1)
      .mockResolvedValueOnce(prefs2);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.preferences).toEqual(prefs1));

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() =>
      expect(result.current.preferences).toEqual(prefs2),
    );
    expect(mockClient.readPreferences).toHaveBeenCalledTimes(2);
  });

  it("refetch does nothing when no project is selected", async () => {
    const { result } = renderHook(() => usePreferences());

    await act(async () => {
      result.current.refetch();
    });

    expect(mockClient.readPreferences).not.toHaveBeenCalled();
  });

  it("clears preferences when active project becomes null", async () => {
    const prefs = makePrefs();
    mockClient.readPreferences.mockResolvedValueOnce(prefs);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    const { result } = renderHook(() => usePreferences());

    await waitFor(() => expect(result.current.preferences).toEqual(prefs));

    act(() => {
      useProjectStore.setState({ activeProject: null });
    });

    await waitFor(() => expect(result.current.preferences).toBeNull());
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
