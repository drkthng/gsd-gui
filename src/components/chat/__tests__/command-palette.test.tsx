import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, within } from "@/test/test-utils";
import { CommandPalette } from "../command-palette";
import { commandTakesArgs } from "../command-palette";
import { useGsdStore } from "@/stores/gsd-store";
import type { GsdCommand } from "@/lib/types";

// ---------------------------------------------------------------------------
// Mock gsd-client so the store can be imported without Tauri
// ---------------------------------------------------------------------------

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    queryState: vi.fn(),
    listProjects: vi.fn(),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
    checkGsdVersion: vi.fn().mockResolvedValue({
      installed: "1.0.0",
      latest: "1.0.0",
      updateAvailable: false,
      changelogUrl: "",
    }),
    upgradeGsd: vi.fn().mockResolvedValue(undefined),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const EXT_CMD: GsdCommand = {
  name: "review",
  description: "Review the current changes",
  source: "extension",
};

const SKILL_CMD: GsdCommand = {
  name: "skill:lint",
  description: "Run the linter",
  source: "extension",
};

const PROMPT_CMD: GsdCommand = {
  name: "refactor",
  description: "Refactor code",
  source: "prompt",
};

const ARGS_PIPE_CMD: GsdCommand = {
  name: "commit",
  description: "Commit changes: feat | fix | chore",
  source: "extension",
};

const ARGS_ANGLE_CMD: GsdCommand = {
  name: "run",
  description: "Run <script> with optional flags",
  source: "extension",
};

const ALL_COMMANDS: GsdCommand[] = [
  EXT_CMD,
  SKILL_CMD,
  PROMPT_CMD,
  ARGS_PIPE_CMD,
  ARGS_ANGLE_CMD,
];

// ---------------------------------------------------------------------------
// Helper: default props
// ---------------------------------------------------------------------------

const noop = () => {};

function defaultProps(overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  return {
    query: "/",
    onSelect: noop,
    onDismiss: noop,
    activeIndex: -1,
    onActiveIndexChange: noop,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Store setup helper
// ---------------------------------------------------------------------------

function setCommands(commands: GsdCommand[], loaded = true) {
  useGsdStore.setState({ availableCommands: commands, commandsLoaded: loaded });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGsdStore.setState({
      sessionState: "idle",
      messages: [],
      isStreaming: false,
      pendingUIRequests: [],
      error: null,
      activeProjectPath: null,
      backendReady: false,
      autoMode: false,
      availableCommands: [],
      commandsLoaded: false,
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("renders spinner and loading text when commandsLoaded=false", () => {
      setCommands([], false);
      renderWithProviders(<CommandPalette {...defaultProps()} />);

      // The listbox is present
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Loading text visible
      expect(screen.getByText(/loading commands/i)).toBeInTheDocument();

      // Spinner element (Loader2 renders an svg)
      // We look for the animate-spin class on an SVG inside the listbox
      const listbox = screen.getByRole("listbox");
      const spinner = listbox.querySelector(".animate-spin");
      expect(spinner).not.toBeNull();
    });

    it("does not render any option rows in loading state", () => {
      setCommands([EXT_CMD], false);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.queryByRole("option")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  describe("filtering by query prefix", () => {
    it("shows all commands when query is '/'", () => {
      setCommands(ALL_COMMANDS);
      renderWithProviders(<CommandPalette {...defaultProps({ query: "/" })} />);
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(ALL_COMMANDS.length);
    });

    it("filters case-insensitively by prefix after stripping leading slash", () => {
      setCommands([EXT_CMD, PROMPT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps({ query: "/REV" })} />);
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(within(options[0]).getByText("/review")).toBeInTheDocument();
    });

    it("shows no-commands message when no match found", () => {
      setCommands([EXT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps({ query: "/zzz" })} />);
      expect(screen.queryByRole("option")).toBeNull();
      expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
    });

    it("matches commands without leading slash in query", () => {
      setCommands([EXT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps({ query: "revi" })} />);
      expect(screen.getAllByRole("option")).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Grouping
  // -------------------------------------------------------------------------

  describe("grouping", () => {
    it("renders 'GSD Commands' section for extension commands whose name does NOT start with 'skill:'", () => {
      setCommands([EXT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("GSD Commands")).toBeInTheDocument();
    });

    it("renders 'Skills' section for commands whose name starts with 'skill:'", () => {
      setCommands([SKILL_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("Skills")).toBeInTheDocument();
    });

    it("renders 'Prompt Templates' section for source === 'prompt' commands", () => {
      setCommands([PROMPT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("Prompt Templates")).toBeInTheDocument();
    });

    it("omits empty sections", () => {
      setCommands([EXT_CMD]); // only extension, no skill: prefix, no prompt
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.queryByText("Skills")).toBeNull();
      expect(screen.queryByText("Prompt Templates")).toBeNull();
    });

    it("renders all three sections when all command types are present", () => {
      setCommands([EXT_CMD, SKILL_CMD, PROMPT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("GSD Commands")).toBeInTheDocument();
      expect(screen.getByText("Skills")).toBeInTheDocument();
      expect(screen.getByText("Prompt Templates")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // activeIndex highlight
  // -------------------------------------------------------------------------

  describe("activeIndex highlight", () => {
    it("applies aria-selected=true to the active row", () => {
      setCommands([EXT_CMD, PROMPT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps({ activeIndex: 0 })} />);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
    });

    it("no option is aria-selected when activeIndex is -1", () => {
      setCommands([EXT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps({ activeIndex: -1 })} />);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
    });
  });

  // -------------------------------------------------------------------------
  // onSelect callback
  // -------------------------------------------------------------------------

  describe("onSelect", () => {
    it("calls onSelect with the clicked command", async () => {
      const { userEvent } = await import("@testing-library/user-event");
      const user = userEvent.setup();
      const onSelect = vi.fn();
      setCommands([EXT_CMD]);
      renderWithProviders(
        <CommandPalette {...defaultProps({ onSelect })} />,
      );
      const option = screen.getByRole("option");
      await user.click(option);
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith(EXT_CMD);
    });
  });

  // -------------------------------------------------------------------------
  // Row rendering
  // -------------------------------------------------------------------------

  describe("row rendering", () => {
    it("prefixes command name with /", () => {
      setCommands([EXT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("/review")).toBeInTheDocument();
    });

    it("truncates description to 60 chars with ellipsis", () => {
      const longDesc = "A".repeat(70);
      const cmd: GsdCommand = { name: "long", description: longDesc, source: "extension" };
      setCommands([cmd]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("A".repeat(60) + "…")).toBeInTheDocument();
    });

    it("renders source badge", () => {
      setCommands([EXT_CMD]);
      renderWithProviders(<CommandPalette {...defaultProps()} />);
      expect(screen.getByText("extension")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// commandTakesArgs helper
// ---------------------------------------------------------------------------

describe("commandTakesArgs", () => {
  it("returns true when description contains pipe character", () => {
    expect(commandTakesArgs(ARGS_PIPE_CMD)).toBe(true);
  });

  it("returns true when description contains angle-bracket placeholder", () => {
    expect(commandTakesArgs(ARGS_ANGLE_CMD)).toBe(true);
  });

  it("returns false for simple description without pipe or angle brackets", () => {
    expect(commandTakesArgs(EXT_CMD)).toBe(false);
  });

  it("returns false for description with > alone (no matching <)", () => {
    const cmd: GsdCommand = {
      name: "test",
      description: "Use when x > y",
      source: "extension",
    };
    expect(commandTakesArgs(cmd)).toBe(false);
  });
});
