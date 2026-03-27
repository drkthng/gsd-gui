import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGsdStore } from "@/stores/gsd-store";
import { RestartBanner } from "../restart-banner";

// Mock Tauri API imports to prevent ESM resolution errors in jsdom
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: vi.fn().mockResolvedValue(undefined),
}));

// Mock gsd-client at module level
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    queryState: vi.fn().mockResolvedValue({ currentMilestone: null, activeTasks: 0, totalCost: 0 }),
    listProjects: vi.fn().mockResolvedValue([]),
    startFileWatcher: vi.fn().mockResolvedValue(undefined),
    stopFileWatcher: vi.fn().mockResolvedValue(undefined),
    checkGsdVersion: vi.fn().mockResolvedValue({ installed: "1.0.0", latest: "1.1.0", updateAvailable: true, changelogUrl: "" }),
    upgradeGsd: vi.fn().mockResolvedValue(undefined),
    onUpgradeProgress: vi.fn().mockResolvedValue(vi.fn()),
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
    notifications: [],
    error: null,
    activeProjectPath: null,
    backendReady: false,
    autoMode: false,
    versionInfo: null,
    upgradeInProgress: false,
    upgradeError: null,
    showRestartBanner: false,
    ...overrides,
  });
}

describe("RestartBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("renders the banner with version text", () => {
    render(<RestartBanner version="1.1.0" />);

    expect(screen.getByTestId("restart-banner")).toBeInTheDocument();
    expect(screen.getByText(/GSD updated to v1\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Restart to apply changes/)).toBeInTheDocument();
  });

  it("renders without version text when version is undefined", () => {
    render(<RestartBanner />);

    expect(screen.getByTestId("restart-banner")).toBeInTheDocument();
    expect(screen.getByText(/GSD updated\./)).toBeInTheDocument();
  });

  it("renders Restart Now and Later buttons", () => {
    render(<RestartBanner version="1.1.0" />);

    expect(screen.getByTestId("restart-now-btn")).toBeInTheDocument();
    expect(screen.getByTestId("restart-later-btn")).toBeInTheDocument();
  });

  it("calls dismissRestartBanner when Later is clicked", async () => {
    const user = userEvent.setup();
    const dismissSpy = vi.fn();
    useGsdStore.setState({ dismissRestartBanner: dismissSpy } as unknown as Parameters<typeof useGsdStore.setState>[0]);

    render(<RestartBanner version="1.1.0" />);

    await user.click(screen.getByTestId("restart-later-btn"));
    expect(dismissSpy).toHaveBeenCalledTimes(1);
  });

  it("calls invoke('restart_app') when Restart Now is clicked", async () => {
    const user = userEvent.setup();
    const { invoke } = await import("@tauri-apps/api/core");

    render(<RestartBanner version="1.1.0" />);
    await user.click(screen.getByTestId("restart-now-btn"));

    // Allow async chain to flush
    await vi.runAllTimersAsync?.().catch(() => {});
    // invoke was called with 'restart_app'
    expect(invoke).toHaveBeenCalledWith("restart_app");
  });
});
