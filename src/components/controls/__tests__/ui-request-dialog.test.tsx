import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { UIRequestDialog } from "../ui-request-dialog";
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

describe("UIRequestDialog", () => {
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

  it("renders nothing when no pending requests", () => {
    const { container } = renderWithProviders(<UIRequestDialog />);
    expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
  });

  it("renders confirm dialog with yes/no buttons", () => {
    useGsdStore.setState({
      pendingUIRequests: [{
        id: "r1",
        method: "confirm",
        payload: { message: "Proceed with auto mode?" },
      }],
    });
    renderWithProviders(<UIRequestDialog />);
    expect(screen.getByText("Proceed with auto mode?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /no/i })).toBeInTheDocument();
  });

  it("renders select dialog with options", () => {
    useGsdStore.setState({
      pendingUIRequests: [{
        id: "r2",
        method: "select",
        payload: { message: "Choose a model:", options: [{ label: "Claude Sonnet" }, { label: "GPT-4o" }] },
      }],
    });
    renderWithProviders(<UIRequestDialog />);
    expect(screen.getByText("Choose a model:")).toBeInTheDocument();
    expect(screen.getByText("Claude Sonnet")).toBeInTheDocument();
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
  });

  it("removes request from queue after responding to confirm", async () => {
    useGsdStore.setState({
      pendingUIRequests: [{
        id: "r1",
        method: "confirm",
        payload: { message: "Continue?" },
      }],
    });
    renderWithProviders(<UIRequestDialog />);
    await userEvent.click(screen.getByRole("button", { name: /yes/i }));
    expect(useGsdStore.getState().pendingUIRequests).toHaveLength(0);
  });
});
