import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../message-input";
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

describe("MessageInput", () => {
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

  it("renders textarea and send button", () => {
    renderWithProviders(<MessageInput />);
    expect(screen.getByPlaceholderText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("sends message on button click", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);
    await userEvent.type(input, "Hello agent");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(useGsdStore.getState().messages).toHaveLength(1);
    expect(useGsdStore.getState().messages[0].content).toBe("Hello agent");
  });

  it("clears input after sending", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i) as HTMLTextAreaElement;
    await userEvent.type(input, "Hello");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(input.value).toBe("");
  });

  it("disables input while streaming", () => {
    useGsdStore.setState({ isStreaming: true });
    renderWithProviders(<MessageInput />);
    expect(screen.getByPlaceholderText(/message/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("does not send empty messages", async () => {
    renderWithProviders(<MessageInput />);
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(useGsdStore.getState().messages).toHaveLength(0);
  });
});
