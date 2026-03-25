import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Capture event handlers registered via onGsdEvent/onProcessExit/etc.
const eventHandlers: Record<string, (payload: unknown) => void> = {};

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn(),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    onGsdEvent: vi.fn().mockImplementation((handler: (p: unknown) => void) => {
      eventHandlers["gsd-event"] = handler;
      return Promise.resolve(vi.fn());
    }),
    onProcessExit: vi.fn().mockImplementation((handler: (p: unknown) => void) => {
      eventHandlers["process-exit"] = handler;
      return Promise.resolve(vi.fn());
    }),
    onProcessError: vi.fn().mockImplementation((handler: (p: unknown) => void) => {
      eventHandlers["process-error"] = handler;
      return Promise.resolve(vi.fn());
    }),
    onFileChanged: vi.fn().mockImplementation((handler: (p: unknown) => void) => {
      eventHandlers["file-changed"] = handler;
      return Promise.resolve(vi.fn());
    }),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

import { useGsdEvents } from "./use-gsd-events";
import { useGsdStore } from "@/stores/gsd-store";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useGsdEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(eventHandlers).forEach((k) => delete eventHandlers[k]);
    useGsdStore.setState({
      sessionState: "connected",
      messages: [],
      isStreaming: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: "/test",
    });
  });

  it("subscribes to all 4 event types on mount", async () => {
    renderHook(() => useGsdEvents(), { wrapper: createWrapper() });
    await vi.waitFor(() => {
      expect(mockClient.onGsdEvent).toHaveBeenCalled();
      expect(mockClient.onProcessExit).toHaveBeenCalled();
      expect(mockClient.onProcessError).toHaveBeenCalled();
      expect(mockClient.onFileChanged).toHaveBeenCalled();
    });
  });

  it("routes gsd-event payloads to store", async () => {
    renderHook(() => useGsdEvents(), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(eventHandlers["gsd-event"]).toBeDefined());

    const raw = JSON.stringify({ type: "agent_start", session_id: "s1" });
    eventHandlers["gsd-event"]({ raw, timestamp: Date.now() });

    expect(useGsdStore.getState().isStreaming).toBe(true);
    expect(useGsdStore.getState().sessionState).toBe("streaming");
  });

  it("routes process-exit to store", async () => {
    renderHook(() => useGsdEvents(), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(eventHandlers["process-exit"]).toBeDefined());

    eventHandlers["process-exit"]({ code: 0, timestamp: Date.now() });
    expect(useGsdStore.getState().sessionState).toBe("disconnected");
  });

  it("routes process-error to store", async () => {
    renderHook(() => useGsdEvents(), { wrapper: createWrapper() });
    await vi.waitFor(() => expect(eventHandlers["process-error"]).toBeDefined());

    eventHandlers["process-error"]({ message: "crash", timestamp: Date.now() });
    expect(useGsdStore.getState().sessionState).toBe("error");
    expect(useGsdStore.getState().error).toBe("crash");
  });
});
