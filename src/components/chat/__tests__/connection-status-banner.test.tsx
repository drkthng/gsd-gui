import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@/test/test-utils";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGsdStore } from "@/stores/gsd-store";
import { ConnectionStatusBanner } from "../connection-status-banner";

// We mock gsd-client at the module level so the store can be imported
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    queryState: vi.fn().mockResolvedValue({ currentMilestone: null, activeTasks: 0, totalCost: 0 }),
    listProjects: vi.fn().mockResolvedValue([]),
    startFileWatcher: vi.fn().mockResolvedValue(undefined),
    stopFileWatcher: vi.fn().mockResolvedValue(undefined),
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

function resetStore(overrides: Partial<ReturnType<typeof useGsdStore.getState>> = {}) {
  useGsdStore.setState({
    sessionState: "idle",
    messages: [],
    isStreaming: false,
    pendingUIRequests: [],
    error: null,
    activeProjectPath: null,
    backendReady: false,
    ...overrides,
  });
}

describe("ConnectionStatusBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("renders nothing when sessionState is connected", () => {
    resetStore({ sessionState: "connected" });
    const { container } = render(<ConnectionStatusBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when sessionState is idle", () => {
    resetStore({ sessionState: "idle" });
    const { container } = render(<ConnectionStatusBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("shows binary-not-found banner with install guidance", () => {
    resetStore({
      sessionState: "error",
      error: 'Could not find gsd binary. Install with: npm i -g gsd-pi',
    });
    render(<ConnectionStatusBanner />);

    expect(screen.getByText("GSD Binary Not Found")).toBeInTheDocument();
    expect(screen.getByText(/Could not find gsd binary/)).toBeInTheDocument();
    expect(screen.getByTestId("reconnect-button")).toBeInTheDocument();
  });

  it("shows generic error banner for other errors", () => {
    resetStore({
      sessionState: "error",
      error: "Connection refused",
    });
    render(<ConnectionStatusBanner />);

    expect(screen.getByText("Connection Error")).toBeInTheDocument();
    expect(screen.getByText("Connection refused")).toBeInTheDocument();
    expect(screen.getByTestId("reconnect-button")).toBeInTheDocument();
  });

  it("shows disconnected banner with reconnect option", () => {
    resetStore({ sessionState: "disconnected", activeProjectPath: "/some/path" });
    render(<ConnectionStatusBanner />);

    expect(screen.getByText("Session Disconnected")).toBeInTheDocument();
    expect(screen.getByTestId("reconnect-button")).toBeInTheDocument();
  });

  it("reconnect button calls store.reconnect()", async () => {
    const user = userEvent.setup();
    resetStore({
      sessionState: "error",
      error: "Connection lost",
      activeProjectPath: "/project",
    });
    render(<ConnectionStatusBanner />);

    await user.click(screen.getByTestId("reconnect-button"));

    // reconnect() calls connect() which calls startSession
    expect(mockClient.startSession).toHaveBeenCalledWith("/project");
  });

  it("dismiss button calls store.clearError()", async () => {
    const user = userEvent.setup();
    resetStore({
      sessionState: "error",
      error: "Some error",
    });
    render(<ConnectionStatusBanner />);

    await user.click(screen.getByTestId("dismiss-button"));

    expect(useGsdStore.getState().error).toBeNull();
  });
});
