import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGsdStore } from "@/stores/gsd-store";
import { NotificationPopover } from "../notification-popover";

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

/** Open the notification popover by clicking the trigger button. */
async function openPopover(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("button", { name: /Notifications/i });
  await user.click(trigger);
}

describe("NotificationPopover — update notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("renders update notification with amber styling and version info", async () => {
    const user = userEvent.setup();
    resetStore({
      notifications: [
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available: 1.0.0 → 1.1.0",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
    });

    render(<NotificationPopover />);
    await openPopover(user);

    expect(screen.getByTestId("update-notification")).toBeInTheDocument();
    expect(screen.getByText("GSD update available")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0 → v1.1.0")).toBeInTheDocument();
  });

  it("shows Update & Restart button when upgrade is not in progress", async () => {
    const user = userEvent.setup();
    resetStore({
      notifications: [
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
      upgradeInProgress: false,
    });

    render(<NotificationPopover />);
    await openPopover(user);

    expect(screen.getByTestId("update-btn")).toBeInTheDocument();
    expect(screen.queryByText("Upgrading…")).not.toBeInTheDocument();
  });

  it("shows Upgrading spinner when upgrade is in progress", async () => {
    const user = userEvent.setup();
    resetStore({
      notifications: [
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
      upgradeInProgress: true,
    });

    render(<NotificationPopover />);
    await openPopover(user);

    expect(screen.getByText("Upgrading…")).toBeInTheDocument();
    expect(screen.queryByTestId("update-btn")).not.toBeInTheDocument();
  });

  it("shows Try again button and error text when upgradeError is set", async () => {
    const user = userEvent.setup();
    resetStore({
      notifications: [
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
      upgradeInProgress: false,
      upgradeError: "npm install failed",
    });

    render(<NotificationPopover />);
    await openPopover(user);

    expect(screen.getByText("npm install failed")).toBeInTheDocument();
    expect(screen.getByTestId("update-try-again-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("update-btn")).not.toBeInTheDocument();
  });

  it("calls runUpgrade when Update & Restart is clicked", async () => {
    const user = userEvent.setup();
    resetStore({
      notifications: [
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
    });
    // Override runUpgrade to spy on calls
    const runUpgradeSpy = vi.fn().mockResolvedValue(undefined);
    useGsdStore.setState({ runUpgrade: runUpgradeSpy } as unknown as Parameters<typeof useGsdStore.setState>[0]);

    render(<NotificationPopover />);
    await openPopover(user);

    await user.click(screen.getByTestId("update-btn"));
    expect(runUpgradeSpy).toHaveBeenCalledTimes(1);
  });

  it("stores dismissed version in localStorage and calls dismissNotification on X click", async () => {
    const user = userEvent.setup();
    const localStorageSpy = vi.spyOn(Storage.prototype, "setItem");

    resetStore({
      notifications: [
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
    });

    render(<NotificationPopover />);
    await openPopover(user);

    const dismissBtn = screen.getByTestId("update-notification-dismiss");
    await user.click(dismissBtn);

    expect(localStorageSpy).toHaveBeenCalledWith("gsd-dismissed-update-version", "1.1.0");
    // Notification should be removed from store
    expect(useGsdStore.getState().notifications).toHaveLength(0);

    localStorageSpy.mockRestore();
  });

  it("renders update notifications before regular notifications", async () => {
    const user = userEvent.setup();
    resetStore({
      notifications: [
        {
          id: "regular-1",
          message: "Normal notification",
          notifyType: "info",
          timestamp: Date.now() - 1000,
        },
        {
          id: "gsd-update-1.1.0",
          message: "GSD update available",
          notifyType: "update",
          timestamp: Date.now(),
          payload: { installed: "1.0.0", latest: "1.1.0" },
        },
      ],
    });

    render(<NotificationPopover />);
    await openPopover(user);

    const items = screen.getAllByRole("listitem", { hidden: true });
    // Update notification should appear in the DOM before the regular one
    const allText = document.body.textContent ?? "";
    const updateIdx = allText.indexOf("GSD update available");
    const regularIdx = allText.indexOf("Normal notification");
    expect(updateIdx).toBeLessThan(regularIdx);
  });
});
