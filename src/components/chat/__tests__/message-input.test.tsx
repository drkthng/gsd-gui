import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../message-input";
import { useGsdStore } from "@/stores/gsd-store";
import type { GsdCommand } from "@/lib/types";

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

// ---------------------------------------------------------------------------
// Fixture commands
// ---------------------------------------------------------------------------

/** A command that takes no arguments (source=extension, simple description). */
const cmdNoArgs: GsdCommand = {
  name: "status",
  description: "Show current GSD status",
  source: "extension",
};

/** A command whose description signals argument usage via angle brackets. */
const cmdWithArgs: GsdCommand = {
  name: "plan",
  description: "Plan <milestone>",
  source: "extension",
};

/** A skill command (prefixed with skill:). */
const cmdSkill: GsdCommand = {
  name: "skill:frontend-design",
  description: "Apply frontend design skill",
  source: "extension",
};

const defaultCommands: GsdCommand[] = [cmdNoArgs, cmdWithArgs, cmdSkill];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupStoreWithCommands(commands: GsdCommand[] = defaultCommands) {
  useGsdStore.setState({
    sessionState: "connected",
    messages: [],
    isStreaming: false,
    pendingUIRequests: [],
    error: null,
    activeProjectPath: "/test",
    availableCommands: commands,
    commandsLoaded: true,
  });
}

// ---------------------------------------------------------------------------
// Existing tests (preserved)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Command palette integration tests
// ---------------------------------------------------------------------------

describe("MessageInput — command palette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStoreWithCommands();
  });

  it("palette opens when / is typed", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);
    await userEvent.type(input, "/");
    expect(screen.getByRole("listbox", { name: /commands/i })).toBeInTheDocument();
  });

  it("palette does not open for non-slash input", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);
    await userEvent.type(input, "hello");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("palette closes when Escape is pressed", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);
    await userEvent.type(input, "/");
    expect(screen.getByRole("listbox", { name: /commands/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("palette closes when a space is typed after the command token", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);
    await userEvent.type(input, "/status");
    expect(screen.getByRole("listbox", { name: /commands/i })).toBeInTheDocument();
    await userEvent.type(input, " ");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("palette filters commands by typed prefix", async () => {
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);
    await userEvent.type(input, "/pla");
    // Should show /plan but not /status
    expect(screen.getByText("/plan")).toBeInTheDocument();
    expect(screen.queryByText("/status")).not.toBeInTheDocument();
  });

  it("Enter on a no-arg command sends immediately without putting text in input", async () => {
    // Only expose the no-arg command to make the selection unambiguous
    setupStoreWithCommands([cmdNoArgs]);
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i) as HTMLTextAreaElement;

    await userEvent.type(input, "/status");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{Enter}");

    // Palette should be gone and input cleared
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input.value).toBe("");

    // Message should have been sent
    await waitFor(() => {
      expect(useGsdStore.getState().messages).toHaveLength(1);
      expect(useGsdStore.getState().messages[0].content).toBe("/status");
    });
  });

  it("Enter on an arg command fills input without sending", async () => {
    // Only the arg command so activeIndex=0 points to it
    setupStoreWithCommands([cmdWithArgs]);
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i) as HTMLTextAreaElement;

    await userEvent.type(input, "/plan");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{Enter}");

    // Palette closes and input is filled with "/plan " ready for argument entry
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input.value).toBe("/plan ");

    // Nothing sent yet
    expect(useGsdStore.getState().messages).toHaveLength(0);
  });

  it("ArrowDown moves active selection down", async () => {
    // Two commands so we can move between them
    setupStoreWithCommands([cmdNoArgs, cmdWithArgs]);
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);

    await userEvent.type(input, "/");
    // Both commands visible; first one (index 0) is active by default
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "false");

    await userEvent.keyboard("{ArrowDown}");
    // After ArrowDown index 1 should be active
    const optionsAfter = screen.getAllByRole("option");
    expect(optionsAfter[0]).toHaveAttribute("aria-selected", "false");
    expect(optionsAfter[1]).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowUp does not go below 0", async () => {
    setupStoreWithCommands([cmdNoArgs, cmdWithArgs]);
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i);

    await userEvent.type(input, "/");
    // index starts at 0 — pressing Up should keep it at 0
    await userEvent.keyboard("{ArrowUp}");
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("Tab selects the active command", async () => {
    setupStoreWithCommands([cmdNoArgs]);
    renderWithProviders(<MessageInput />);
    const input = screen.getByPlaceholderText(/message/i) as HTMLTextAreaElement;

    await userEvent.type(input, "/status");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{Tab}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(useGsdStore.getState().messages).toHaveLength(1);
    });
  });
});
