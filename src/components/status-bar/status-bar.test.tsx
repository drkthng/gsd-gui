import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import { StatusBar } from "./status-bar";
import { useGsdStore } from "@/stores/gsd-store";
import { useProjectStore } from "@/stores/project-store";
import type { PreferencesData, ActivityEntry } from "@/lib/types";

// Mock gsd-client to prevent Tauri import errors
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn().mockResolvedValue({ currentMilestone: null, activeTasks: 0, totalCost: 0 }),
    listProjects: vi.fn(),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
    // Stubs for useStatusBarData queries
    readPreferences: vi.fn<[string], Promise<PreferencesData>>().mockResolvedValue(
      {} as PreferencesData,
    ),
    listActivity: vi.fn<[string], Promise<ActivityEntry[]>>().mockResolvedValue([]),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

describe("StatusBar", () => {
  beforeEach(() => {
    useGsdStore.setState({
      sessionState: "idle",
      messages: [],
      isStreaming: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: null,
    });
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("renders as a footer element", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("shows idle status when no session", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("shows dash for milestone when no project active", () => {
    renderWithProviders(<StatusBar />);
    // There are now multiple "—" elements: milestone badge, model name, breadcrumb
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows zero cost when no data", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows project name when active", () => {
    useProjectStore.setState({
      activeProject: { id: "p1", name: "My Project", path: "/p1", description: null, addedAt: "0" },
    });
    renderWithProviders(<StatusBar />);
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });

  it("shows connected status", () => {
    useGsdStore.setState({ sessionState: "connected" });
    renderWithProviders(<StatusBar />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows error status with destructive badge", () => {
    useGsdStore.setState({ sessionState: "error" });
    renderWithProviders(<StatusBar />);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // New tests: model name and breadcrumb
  // ---------------------------------------------------------------------------

  it("shows dash for model name and breadcrumb when no active project", () => {
    renderWithProviders(<StatusBar />);
    // Both model name and breadcrumb slots render "—" when no project is active
    const dashes = screen.getAllByText("—");
    // At minimum the milestone badge plus model name and breadcrumb dashes
    expect(dashes.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("model name")).toHaveTextContent("—");
    expect(screen.getByLabelText("task breadcrumb")).toHaveTextContent("—");
  });

  it("renders model name from preferences once loaded", async () => {
    mockClient.readPreferences.mockResolvedValue({
      models: { execution: "claude-sonnet-4-5" },
    } as unknown as PreferencesData);
    mockClient.listActivity.mockResolvedValue([]);

    useProjectStore.setState({
      activeProject: { id: "p1", name: "Project", path: "/p1", description: null, addedAt: "0" },
    });

    renderWithProviders(<StatusBar />);

    await waitFor(() => {
      expect(screen.getByLabelText("model name")).toHaveTextContent("claude-sonnet-4-5");
    });
  });

  it("renders task breadcrumb from activity once loaded", async () => {
    mockClient.readPreferences.mockResolvedValue({} as PreferencesData);
    mockClient.listActivity.mockResolvedValue([
      {
        id: "1",
        action: "execute-task",
        milestoneId: "M013",
        sliceId: "S02",
        taskId: "T01",
        timestamp: "2024-06-01T12:00:00Z",
        messageCount: 10,
      },
    ] satisfies ActivityEntry[]);

    useProjectStore.setState({
      activeProject: { id: "p1", name: "Project", path: "/p1", description: null, addedAt: "0" },
    });

    renderWithProviders(<StatusBar />);

    await waitFor(() => {
      expect(screen.getByLabelText("task breadcrumb")).toHaveTextContent("M013/S02/T01");
    });
  });
});
