import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { SessionsPage } from "@/pages/sessions-page";
import type { SessionInfo, SavedProject } from "@/lib/types";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn(),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    getSavedProjects: vi.fn().mockResolvedValue([]),
    addProject: vi.fn(),
    removeProject: vi.fn(),
    listSessions: vi.fn().mockResolvedValue([]),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  }),
}));

const mockUseSessions = vi.fn();
vi.mock("@/hooks/use-sessions", () => ({
  useSessions: (...args: unknown[]) => mockUseSessions(...args),
}));

const mockUseProjectStore = vi.fn();
vi.mock("@/stores/project-store", () => ({
  useProjectStore: (...args: unknown[]) => mockUseProjectStore(...args),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeProject: SavedProject = {
  id: "proj-1",
  name: "Alpha",
  path: "/projects/alpha",
  description: null,
  addedAt: "2026-01-01T00:00:00Z",
};

const fakeSession: SessionInfo = {
  id: "session-001",
  name: "Session 1",
  messageCount: 5,
  cost: 0.12,
  createdAt: "2024-01-01T10:00:00Z",
  lastActiveAt: "2024-01-01T11:00:00Z",
  preview: "First message preview",
  parentId: null,
  isActive: false,
};

<<<<<<< HEAD
const defaultProjectState: {
  activeProject: SavedProject | null;
  projects: SavedProject[];
  isLoading: boolean;
  error: string | null;
  loadProjects: ReturnType<typeof vi.fn>;
  addProject: ReturnType<typeof vi.fn>;
  removeProject: ReturnType<typeof vi.fn>;
  selectProject: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
} = {
  activeProject: fakeProject,
=======
const defaultProjectState = {
  activeProject: fakeProject as SavedProject | null,
>>>>>>> milestone/M011
  projects: [] as SavedProject[],
  isLoading: false,
  error: null,
  loadProjects: vi.fn(),
  addProject: vi.fn(),
  removeProject: vi.fn(),
  selectProject: vi.fn(),
  clearError: vi.fn(),
};

const defaultSessionsData = {
  sessions: [],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // useProjectStore is called with a selector — invoke it on the full state object
  mockUseProjectStore.mockImplementation(
    (selector: (s: typeof defaultProjectState) => unknown) =>
      selector(defaultProjectState),
  );
  mockUseSessions.mockReturnValue(defaultSessionsData);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SessionsPage", () => {
  it("renders empty state when no project is selected", () => {
    mockUseProjectStore.mockImplementation(
      (selector: (s: typeof defaultProjectState) => unknown) =>
        selector({ ...defaultProjectState, activeProject: null }),
    );

    renderWithProviders(<SessionsPage />);

    expect(screen.getByText("No project selected")).toBeInTheDocument();
    expect(
      screen.getByText(/Select a project from the gallery/i),
    ).toBeInTheDocument();
  });

  it("renders loading state while sessions are being fetched", () => {
    mockUseSessions.mockReturnValue({ ...defaultSessionsData, isLoading: true });

    renderWithProviders(<SessionsPage />);

    expect(screen.getByText("Loading sessions…")).toBeInTheDocument();
  });

  it("renders SessionBrowser when sessions are available", () => {
    mockUseSessions.mockReturnValue({
      ...defaultSessionsData,
      sessions: [fakeSession],
    });

    renderWithProviders(<SessionsPage />);

    // SessionBrowser renders session name
    expect(screen.getByText("Session 1")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", () => {
    mockUseSessions.mockReturnValue({
      ...defaultSessionsData,
      error: "IPC timeout",
    });

    renderWithProviders(<SessionsPage />);

    expect(screen.getByText("Failed to load sessions")).toBeInTheDocument();
    expect(screen.getByText("IPC timeout")).toBeInTheDocument();
  });

  it("renders page heading and icon", () => {
    renderWithProviders(<SessionsPage />);

    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByTestId("page-icon")).toBeInTheDocument();
  });
});
