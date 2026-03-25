import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ChatMessage } from "../chat-message";
import { ChatView } from "../chat-view";
import { useGsdStore } from "@/stores/gsd-store";

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(), stopSession: vi.fn(), sendCommand: vi.fn(),
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

describe("ChatMessage", () => {
  it("renders user message with correct styling", () => {
    renderWithProviders(
      <ChatMessage message={{ role: "user", content: "Hello agent", timestamp: Date.now() }} />
    );
    expect(screen.getByText("Hello agent")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("renders assistant message with correct styling", () => {
    renderWithProviders(
      <ChatMessage message={{ role: "assistant", content: "I can help with that.", timestamp: Date.now() }} />
    );
    expect(screen.getByText(/I can help with that/)).toBeInTheDocument();
    expect(screen.getByText("GSD")).toBeInTheDocument();
  });

  it("renders markdown in assistant messages", () => {
    renderWithProviders(
      <ChatMessage message={{ role: "assistant", content: "Here is **bold** text", timestamp: Date.now() }} />
    );
    const bold = screen.getByText("bold");
    expect(bold.tagName).toBe("STRONG");
  });

  it("renders code blocks in assistant messages", () => {
    renderWithProviders(
      <ChatMessage message={{ role: "assistant", content: "```js\nconsole.log('hi')\n```", timestamp: Date.now() }} />
    );
    expect(screen.getByText("console.log('hi')")).toBeInTheDocument();
  });
});

describe("ChatView", () => {
  beforeEach(() => {
    useGsdStore.setState({
      sessionState: "connected",
      messages: [],
      isStreaming: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: "/test",
    });
  });

  it("shows empty state when no messages", () => {
    renderWithProviders(<ChatView />);
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it("renders messages from store", () => {
    useGsdStore.setState({
      messages: [
        { role: "user", content: "Hello", timestamp: 1 },
        { role: "assistant", content: "Hi there!", timestamp: 2 },
      ],
    });
    renderWithProviders(<ChatView />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText(/Hi there!/)).toBeInTheDocument();
  });

  it("shows streaming indicator when streaming", () => {
    useGsdStore.setState({ isStreaming: true });
    renderWithProviders(<ChatView />);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });
});
