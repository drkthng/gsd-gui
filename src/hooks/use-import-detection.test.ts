import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ProjectMetadata } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock GSD client (vi.hoisted required for module-scope client instantiation)
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
    initProject: vi.fn().mockResolvedValue(undefined),
    detectProjectMetadata: vi.fn().mockResolvedValue(null),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useImportDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // (a) Returns null state while idle (before detect is called)
  it("returns null metadata, no error, not loading while idle", async () => {
    const { useImportDetection } = await import("./use-import-detection");
    const { result } = renderHook(() => useImportDetection());

    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // (b) Returns populated ProjectMetadata when detection resolves
  it("populates metadata after detect resolves", async () => {
    const fakeMetadata: ProjectMetadata = {
      detectedName: "my-app",
      language: "TypeScript",
      hasGsd: false,
      hasPlanning: false,
      isGit: true,
    };
    mockClient.detectProjectMetadata.mockResolvedValueOnce(fakeMetadata);

    const { useImportDetection } = await import("./use-import-detection");
    const { result } = renderHook(() => useImportDetection());

    await act(async () => {
      await result.current.detect("/home/user/my-app");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.metadata).toEqual(fakeMetadata);
    expect(result.current.error).toBeNull();
    expect(mockClient.detectProjectMetadata).toHaveBeenCalledWith("/home/user/my-app");
  });

  // (c) Returns error string on rejection
  it("sets error when detectProjectMetadata rejects", async () => {
    mockClient.detectProjectMetadata.mockRejectedValueOnce(
      new Error("path not found"),
    );

    const { useImportDetection } = await import("./use-import-detection");
    const { result } = renderHook(() => useImportDetection());

    await act(async () => {
      await result.current.detect("/bad/path");
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("path not found");
    expect(result.current.metadata).toBeNull();
  });

  // (d) isLoading is true during the async call
  it("sets isLoading to true while detect is in-flight", async () => {
    let resolve!: (v: ProjectMetadata) => void;
    mockClient.detectProjectMetadata.mockReturnValueOnce(
      new Promise((r) => { resolve = r; }),
    );

    const { useImportDetection } = await import("./use-import-detection");
    const { result } = renderHook(() => useImportDetection());

    act(() => {
      void result.current.detect("/some/path");
    });

    // isLoading should be true before the promise resolves
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve({
        detectedName: "done",
        language: null,
        hasGsd: false,
        hasPlanning: false,
        isGit: false,
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // (e) reset() clears state
  it("reset() clears metadata and error", async () => {
    const fakeMetadata: ProjectMetadata = {
      detectedName: "app",
      language: "Rust",
      hasGsd: true,
      hasPlanning: false,
      isGit: true,
    };
    mockClient.detectProjectMetadata.mockResolvedValueOnce(fakeMetadata);

    const { useImportDetection } = await import("./use-import-detection");
    const { result } = renderHook(() => useImportDetection());

    await act(async () => {
      await result.current.detect("/some/path");
    });

    expect(result.current.metadata).toEqual(fakeMetadata);

    act(() => {
      result.current.reset();
    });

    expect(result.current.metadata).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
