import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn().mockResolvedValue({
      currentMilestone: "M001",
      activeTasks: 3,
      totalCost: 1.5,
    }),
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

import { useGsdState } from "./use-gsd-state";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useGsdState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state initially", () => {
    const { result } = renderHook(() => useGsdState("/project"), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it("returns snapshot data on success", async () => {
    const { result } = renderHook(() => useGsdState("/project"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      currentMilestone: "M001",
      activeTasks: 3,
      totalCost: 1.5,
    });
    expect(mockClient.queryState).toHaveBeenCalledWith("/project");
  });

  it("returns null data when no project path", async () => {
    const { result } = renderHook(() => useGsdState(null), {
      wrapper: createWrapper(),
    });
    // Query should be disabled when path is null
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("returns error on failure", async () => {
    mockClient.queryState.mockRejectedValueOnce(new Error("query failed"));
    const { result } = renderHook(() => useGsdState("/bad"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
