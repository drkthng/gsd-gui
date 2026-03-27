import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders, screen, waitFor, act } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";

// ---------------------------------------------------------------------------
// Mock GSD client (vi.hoisted so the module-scope client in usePreferences
// and useProjectStore pick up the same mock instance)
// ---------------------------------------------------------------------------
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn().mockResolvedValue([]),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    parseProjectMilestones: vi.fn().mockResolvedValue([]),
    getSavedProjects: vi.fn().mockResolvedValue([]),
    addProject: vi.fn(),
    removeProject: vi.fn(),
    listSessions: vi.fn().mockResolvedValue([]),
    readPreferences: vi.fn().mockResolvedValue({}),
    writePreferences: vi.fn().mockResolvedValue(undefined),
    listActivity: vi.fn().mockResolvedValue([]),
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

import { ConfigPanel } from "../config-panel";
import { useProjectStore } from "@/stores/project-store";
import type { PreferencesData, SavedProject } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeProject = (id = "p1", name = "alpha"): SavedProject => ({
  id,
  name,
  path: `/projects/${name}`,
  description: null,
  addedAt: "1234567890",
});

const makePrefs = (overrides: Partial<PreferencesData> = {}): PreferencesData => ({
  version: 1,
  mode: "manual",
  git: { isolation: "branch", auto_push: true },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockClient.readPreferences.mockResolvedValue({});
  mockClient.writePreferences.mockResolvedValue(undefined);
  useProjectStore.setState({
    projects: [],
    activeProject: null,
    isLoading: false,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConfigPanel", () => {
  it("shows no-project empty state when no activeProject is selected", () => {
    renderWithProviders(<ConfigPanel />);

    expect(screen.getByText("No project selected")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("shows loading state while hook is loading", async () => {
    // Block the preferences fetch indefinitely
    mockClient.readPreferences.mockReturnValue(new Promise(() => {}));

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() =>
      expect(screen.getByText("Loading preferences…")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders form fields populated from loaded preferences", async () => {
    const prefs = makePrefs({ mode: "manual" });
    mockClient.readPreferences.mockResolvedValueOnce(prefs);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    // Wait for loading to complete and tabs to appear
    await waitFor(() =>
      expect(screen.getByRole("tablist")).toBeInTheDocument(),
    );

    // General tab: workflow mode should reflect prefs.mode = "manual"
    expect(screen.getByText(/Manual/)).toBeInTheDocument();
  });

  it("switches to Git tab and shows isolation mode from preferences", async () => {
    const prefs = makePrefs({ git: { isolation: "branch", auto_push: true } });
    mockClient.readPreferences.mockResolvedValueOnce(prefs);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("tab", { name: /git/i }));

    expect(screen.getByText("Isolation Mode")).toBeInTheDocument();
    // The selected value should reflect prefs.git.isolation = "branch"
    expect(screen.getByText(/Branch/)).toBeInTheDocument();
  });

  it("clicking Save calls savePreferences with merged form data", async () => {
    const prefs = makePrefs({ mode: "auto" });
    mockClient.readPreferences.mockResolvedValueOnce(prefs);
    // After save, re-fetch returns same prefs
    mockClient.readPreferences.mockResolvedValue(prefs);

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mockClient.writePreferences).toHaveBeenCalledWith(
        project.path,
        expect.objectContaining({ mode: "auto" }),
      ),
    );
  });

  it("shows saving indicator on button while save is in progress", async () => {
    const prefs = makePrefs();
    mockClient.readPreferences.mockResolvedValueOnce(prefs);

    // Block the write indefinitely so we can observe the in-progress state
    let resolveWrite: () => void;
    mockClient.writePreferences.mockReturnValue(
      new Promise<void>((r) => {
        resolveWrite = r;
      }),
    );

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument(),
    );

    // Click save — button should change to "Saving…"
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    // Resolve the write
    await act(async () => {
      resolveWrite!();
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument(),
    );
  });

  it("shows error alert on fetch failure", async () => {
    mockClient.readPreferences.mockRejectedValueOnce(new Error("IPC timeout"));

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() =>
      expect(screen.getByText("IPC timeout")).toBeInTheDocument(),
    );
  });

  it("renders all four tabs after preferences load", async () => {
    mockClient.readPreferences.mockResolvedValueOnce(makePrefs());

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /models/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /git/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /budget/i })).toBeInTheDocument();
  });

  it("Budget tab shows ceiling input", async () => {
    mockClient.readPreferences.mockResolvedValueOnce(makePrefs());

    const project = makeProject();
    useProjectStore.setState({ activeProject: project });

    renderWithProviders(<ConfigPanel />);

    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("tab", { name: /budget/i }));

    expect(screen.getByLabelText(/Budget Ceiling/)).toBeInTheDocument();
  });
});
