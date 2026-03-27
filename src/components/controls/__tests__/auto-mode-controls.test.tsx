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
      autoMode: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: "/test",
    });
  });

  it("shows Start Auto button when not streaming and not in auto mode", () => {
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /start auto/i })).toBeInTheDocument();
  });

  it("shows Stop button when streaming", () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /stop auto/i })).toBeInTheDocument();
  });

  it("shows Stop button when autoMode is true", () => {
    useGsdStore.setState({ autoMode: true });
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /stop auto/i })).toBeInTheDocument();
  });

  it("sends /gsd auto prompt via startAuto on Start Auto click", async () => {
    renderWithProviders(<AutoModeControls />);
    await userEvent.click(screen.getByRole("button", { name: /start auto/i }));
    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "prompt", message: "/gsd auto" })
    );
  });

  it("sends abort RPC via stopAuto on Stop click", async () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);
    await userEvent.click(screen.getByRole("button", { name: /stop auto/i }));
    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "abort" })
    );
  });

  it("sends /gsd next prompt via nextStep on Next Step click", async () => {
    renderWithProviders(<AutoModeControls />);
    await userEvent.click(screen.getByRole("button", { name: /next step/i }));
    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "prompt", message: "/gsd next" })
    );
  });

  it("shows Next Step button", () => {
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /next step/i })).toBeInTheDocument();
  });

  it("shows Steer button when streaming", () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);
    expect(screen.getByRole("button", { name: /steer execution/i })).toBeInTheDocument();
  });

  it("steer sends steer RPC with text from inline input", async () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);

    // Click Steer to show input
    await userEvent.click(screen.getByRole("button", { name: /steer execution/i }));

    // Type steer instruction
    const input = screen.getByLabelText(/steer input/i);
    await userEvent.type(input, "focus on tests");

    // Submit via Send button
    await userEvent.click(screen.getByRole("button", { name: /send steer/i }));

    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "steer", message: "focus on tests" })
    );
  });

  it("steer input submits on Enter key", async () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);

    await userEvent.click(screen.getByRole("button", { name: /steer execution/i }));
    const input = screen.getByLabelText(/steer input/i);
    await userEvent.type(input, "adjust priority{Enter}");

    expect(mockClient.sendCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "steer", message: "adjust priority" })
    );
  });

  it("steer input closes on Escape without sending", async () => {
    useGsdStore.setState({ isStreaming: true, sessionState: "streaming" });
    renderWithProviders(<AutoModeControls />);

    await userEvent.click(screen.getByRole("button", { name: /steer execution/i }));
    const input = screen.getByLabelText(/steer input/i);
    await userEvent.type(input, "something{Escape}");

    expect(mockClient.sendCommand).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/steer input/i)).not.toBeInTheDocument();
  });
});
