import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock useActivity hook
// ---------------------------------------------------------------------------
const { mockUseActivity } = vi.hoisted(() => {
  const mockUseActivity = vi.fn();
  return { mockUseActivity };
});

vi.mock("@/hooks/use-activity", () => ({
  useActivity: mockUseActivity,
}));

import { LogViewerPanel } from "./log-viewer-panel";
import type { ActivityEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

describe("LogViewerPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the panel title", () => {
    mockUseActivity.mockReturnValue({
      activity: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LogViewerPanel />);
    expect(screen.getByText("Log Viewer")).toBeInTheDocument();
  });

  it("renders loading state while fetching", () => {
    mockUseActivity.mockReturnValue({
      activity: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<LogViewerPanel />);
    expect(screen.getByText("Loading Log Viewer…")).toBeInTheDocument();
  });

  it("renders error state with retry button", async () => {
    const refetch = vi.fn();
    mockUseActivity.mockReturnValue({
      activity: [],
      isLoading: false,
      error: "IPC timeout",
      refetch,
    });

    render(<LogViewerPanel />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("IPC timeout")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    await act(async () => {
      retryBtn.click();
    });
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("renders empty state when no activity", () => {
    mockUseActivity.mockReturnValue({
      activity: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LogViewerPanel />);
    expect(screen.getByTestId("panel-empty")).toBeInTheDocument();
    expect(screen.getByText("No data available.")).toBeInTheDocument();
  });

  it("renders activity entries with action and milestone path", () => {
    const entries = [
      makeEntry({
        id: "a1",
        action: "plan-slice",
        milestoneId: "M001",
        sliceId: "S02",
        taskId: null,
      }),
      makeEntry({
        id: "a2",
        action: "execute-task",
        milestoneId: "M002",
        sliceId: "S01",
        taskId: "T03",
      }),
    ];

    mockUseActivity.mockReturnValue({
      activity: entries,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LogViewerPanel />);

    expect(screen.getByTestId("log-a1")).toBeInTheDocument();
    expect(screen.getByTestId("log-a2")).toBeInTheDocument();

    expect(screen.getByText("plan-slice")).toBeInTheDocument();
    expect(screen.getByText("execute-task")).toBeInTheDocument();

    expect(screen.getByText("M001/S02")).toBeInTheDocument();
    expect(screen.getByText("M002/S01/T03")).toBeInTheDocument();
  });

  it("renders milestone path without sliceId/taskId", () => {
    const entry = makeEntry({
      id: "a1",
      action: "plan-milestone",
      milestoneId: "M003",
      sliceId: null,
      taskId: null,
    });

    mockUseActivity.mockReturnValue({
      activity: [entry],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LogViewerPanel />);
    expect(screen.getByText("M003")).toBeInTheDocument();
  });
});
