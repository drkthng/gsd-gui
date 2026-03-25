import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { useGsdStore } from "@/stores/gsd-store";

// Mock sonner
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
}));

// Mock gsd-client so store can be created
vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn(),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  }),
}));

import { useToastNotifications } from "./use-toast-notifications";

describe("useToastNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to defaults
    useGsdStore.setState({
      sessionState: "idle",
      error: null,
      isStreaming: false,
      messages: [],
      pendingUIRequests: [],
      activeProjectPath: null,
    });
  });

  it("fires error toast when error appears in store", () => {
    renderHook(() => useToastNotifications());

    act(() => {
      useGsdStore.setState({ error: "Connection failed" });
    });

    expect(toast.error).toHaveBeenCalledWith("Error", {
      description: "Connection failed",
    });
  });

  it("does not fire error toast when error is cleared", () => {
    useGsdStore.setState({ error: "some error" });
    renderHook(() => useToastNotifications());
    vi.clearAllMocks();

    act(() => {
      useGsdStore.setState({ error: null });
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("fires success toast when streaming ends (agent finished)", () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderHook(() => useToastNotifications());

    act(() => {
      useGsdStore.setState({ isStreaming: false, sessionState: "connected" });
    });

    expect(toast.success).toHaveBeenCalledWith("Agent finished", {
      description: "Task completed successfully",
    });
  });

  it("fires warning toast on unexpected disconnect", () => {
    useGsdStore.setState({ sessionState: "connected" });
    renderHook(() => useToastNotifications());

    act(() => {
      useGsdStore.setState({ sessionState: "disconnected" });
    });

    expect(toast.warning).toHaveBeenCalledWith("Disconnected", {
      description: "GSD session ended",
    });
  });

  it("does not fire disconnect toast from idle to disconnected", () => {
    renderHook(() => useToastNotifications());

    act(() => {
      useGsdStore.setState({ sessionState: "disconnected" });
    });

    expect(toast.warning).not.toHaveBeenCalled();
  });
});
