import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { StatusBar } from "./status-bar";
import { useGsdStore } from "@/stores/gsd-store";
import { useProjectStore } from "@/stores/project-store";

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
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows zero cost when no data", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows project name when active", () => {
    useProjectStore.setState({
      activeProject: { id: "p1", name: "My Project", path: "/p1" },
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
});
