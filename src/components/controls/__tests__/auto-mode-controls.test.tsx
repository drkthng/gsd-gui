import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { AutoModeControls } from "../auto-mode-controls";
import { useGsdStore } from "@/stores/gsd-store";

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(), stopSession: vi.fn(),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(), onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

describe("AutoModeControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGsdStore.setState({
      sessionState: "connected",
      messages: [],
      isStreaming: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: "/test",
    });
  });

  it("shows Start Auto button when not streaming", () => {
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /start auto/i })).toBeInTheDocument();
  });

  it("shows Pause button when streaming", () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("sends auto command on Start Auto click", async () => {
    renderWithProviders(<AutoModeControls />);
    await userEvent.click(screen.getByRole("button", { name: /start auto/i }));
    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "prompt", text: "/gsd auto" })
    );
  });

  it("sends stop command on Pause click", async () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);
    await userEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "prompt", text: "/gsd stop" })
    );
  });

  it("shows Next Step button", () => {
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /next step/i })).toBeInTheDocument();
  });

  it("shows Steer button when streaming", () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /steer/i })).toBeInTheDocument();
  });
});
