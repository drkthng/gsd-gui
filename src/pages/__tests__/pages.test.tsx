import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, within } from "@/test/test-utils";
import { ChatPage } from "@/pages/chat-page";
import { ProjectsPage } from "@/pages/projects-page";
import { MilestonesPage } from "@/pages/milestones-page";
import { TimelinePage } from "@/pages/timeline-page";
import { CostsPage } from "@/pages/costs-page";
import { SettingsPage } from "@/pages/settings-page";
import { HelpPage } from "@/pages/help-page";
import { mockMilestones, mockCostData } from "@/test/mock-data";

// ---------------------------------------------------------------------------
// Module mocks — hoisted by vitest
// ---------------------------------------------------------------------------

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(), stopSession: vi.fn(), sendCommand: vi.fn(),
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(), getGitBranch: vi.fn().mockResolvedValue(null),
    getSavedProjects: vi.fn().mockResolvedValue([]),
    addProject: vi.fn(), removeProject: vi.fn(),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
    readPreferences: vi.fn().mockResolvedValue(null),
    writePreferences: vi.fn().mockResolvedValue(undefined),
  }),
}));

const mockUseMilestoneData = vi.fn();
vi.mock("@/hooks/use-milestone-data", () => ({
  useMilestoneData: (...args: unknown[]) => mockUseMilestoneData(...args),
}));

const mockUseProjectStore = vi.fn();
vi.mock("@/stores/project-store", () => ({
  useProjectStore: (...args: unknown[]) => mockUseProjectStore(...args),
}));

// ---------------------------------------------------------------------------
// Default mock return values — active project with data loaded
// ---------------------------------------------------------------------------

const defaultMilestoneData = {
  milestones: mockMilestones,
  costData: mockCostData,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

const fakeActiveProject = {
  id: "test-project",
  name: "Test Project",
  path: "/test/project",
  description: null,
  addedAt: "2026-01-01T00:00:00Z",
};

const defaultProjectState = {
  activeProject: fakeActiveProject,
  projects: [] as typeof fakeActiveProject[],
  isLoading: false,
  error: null,
  loadProjects: vi.fn(),
  addProject: vi.fn(),
  removeProject: vi.fn(),
  selectProject: vi.fn(),
  clearError: vi.fn(),
};

beforeEach(() => {
  mockUseMilestoneData.mockReturnValue(defaultMilestoneData);
  // useProjectStore is called with a selector — invoke it on the full state object
  mockUseProjectStore.mockImplementation((selector: (s: unknown) => unknown) => {
    return selector(defaultProjectState);
  });
});

// ---------------------------------------------------------------------------
// Page definitions
// ---------------------------------------------------------------------------

interface PageDef {
  name: string;
  Component: React.ComponentType;
  uniqueText: string;
  hasMockSections?: boolean;
  sections?: string[];
}

const pages: PageDef[] = [
  {
    name: "Chat",
    Component: ChatPage,
    uniqueText: "Start a conversation",
    hasMockSections: false,
  },
  {
    name: "Projects",
    Component: ProjectsPage,
    uniqueText: "No projects",
    hasMockSections: false,
  },
  {
    name: "Milestones",
    Component: MilestonesPage,
    uniqueText: "M001",
    hasMockSections: false,
  },
  {
    name: "Timeline",
    Component: TimelinePage,
    uniqueText: "Rust process manager",
    hasMockSections: false,
  },
  {
    name: "Costs",
    Component: CostsPage,
    uniqueText: "Cost by Phase",
    hasMockSections: false,
  },
  {
    name: "Settings",
    Component: SettingsPage,
    uniqueText: "Workflow Mode",
    hasMockSections: false,
  },
  {
    name: "Help",
    Component: HelpPage,
    uniqueText: "Getting Started",
    hasMockSections: true,
    sections: ["Getting Started", "Keyboard Shortcuts"],
  },
];

// ---------------------------------------------------------------------------
// Existing test suites (28 tests preserved)
// ---------------------------------------------------------------------------

describe("Page components", () => {
  for (const { name, Component } of pages) {
    it(`${name}Page renders a heading with "${name}"`, () => {
      renderWithProviders(<Component />);
      expect(
        screen.getByRole("heading", { level: 1, name: new RegExp(name, "i") }),
      ).toBeInTheDocument();
    });
  }

  for (const { name, Component } of pages) {
    it(`${name}Page renders a page icon`, () => {
      renderWithProviders(<Component />);
      expect(screen.getByTestId("page-icon")).toBeInTheDocument();
    });
  }

  for (const { name, Component, uniqueText } of pages) {
    it(`${name}Page renders page-specific content ("${uniqueText}")`, async () => {
      renderWithProviders(<Component />);
      expect(await screen.findByText(new RegExp(uniqueText, "i"))).toBeInTheDocument();
    });
  }

  const pagesWithMockSections = pages.filter((p) => p.hasMockSections && p.sections);
  for (const { name, Component, sections } of pagesWithMockSections) {
    it(`${name}Page renders mock data sections`, () => {
      renderWithProviders(<Component />);
      const mockSections = screen.getAllByTestId("mock-section");
      expect(mockSections.length).toBeGreaterThanOrEqual(2);
      for (const sectionTitle of sections!) {
        const matches = screen.getAllByText(new RegExp(sectionTitle, "i"));
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// New: data-driven pages — no project selected, loading, and error states
// ---------------------------------------------------------------------------

const dataPages = [
  { name: "Milestones", Component: MilestonesPage },
  { name: "Timeline", Component: TimelinePage },
  { name: "Costs", Component: CostsPage },
] as const;

describe("Data-driven pages — no project selected", () => {
  beforeEach(() => {
    mockUseProjectStore.mockImplementation((selector: (s: unknown) => unknown) => {
      const state = { activeProject: null, projects: [], isLoading: false, error: null };
      return selector(state);
    });
    mockUseMilestoneData.mockReturnValue({
      milestones: [],
      costData: { totalCost: 0, budgetCeiling: null, byPhase: [], byModel: [], bySlice: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  for (const { name, Component } of dataPages) {
    it(`${name}Page shows empty state when no project selected`, () => {
      renderWithProviders(<Component />);
      expect(screen.getByText(/no project selected/i)).toBeInTheDocument();
      expect(screen.getByText(/select a project/i)).toBeInTheDocument();
    });
  }
});

describe("Data-driven pages — loading state", () => {
  beforeEach(() => {
    mockUseMilestoneData.mockReturnValue({
      milestones: [],
      costData: { totalCost: 0, budgetCeiling: null, byPhase: [], byModel: [], bySlice: [] },
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
  });

  for (const { name, Component } of dataPages) {
    it(`${name}Page shows loading state`, () => {
      renderWithProviders(<Component />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  }
});

describe("Data-driven pages — error state", () => {
  beforeEach(() => {
    mockUseMilestoneData.mockReturnValue({
      milestones: [],
      costData: { totalCost: 0, budgetCeiling: null, byPhase: [], byModel: [], bySlice: [] },
      isLoading: false,
      error: "IPC connection failed",
      refetch: vi.fn(),
    });
  });

  for (const { name, Component } of dataPages) {
    it(`${name}Page shows error message`, () => {
      renderWithProviders(<Component />);
      expect(screen.getByText(/IPC connection failed/i)).toBeInTheDocument();
    });
  }
});

// ---------------------------------------------------------------------------
// Milestones page — filter integration
// ---------------------------------------------------------------------------

describe("MilestonesPage — filter integration", () => {
  // Default mocks give us mockMilestones: M001 (done) + M002 (in-progress)

  /** Helper: get the FilterBar container scoped to the role="group" element. */
  function getFilterBar() {
    return within(screen.getByRole("group", { name: /filter milestones/i }));
  }

  it("renders the filter bar when milestones are loaded", () => {
    renderWithProviders(<MilestonesPage />);
    const filterBar = getFilterBar();
    // All filter buttons present inside the filter bar
    expect(filterBar.getByRole("button", { name: /^All/i })).toBeInTheDocument();
    expect(filterBar.getByRole("button", { name: /^Active/i })).toBeInTheDocument();
    expect(filterBar.getByRole("button", { name: /^Complete/i })).toBeInTheDocument();
    expect(filterBar.getByRole("button", { name: /^Planned/i })).toBeInTheDocument();
  });

  it("shows grouped milestones with Active and Complete headers", () => {
    renderWithProviders(<MilestonesPage />);
    // Group headers from the grouped list
    const activeHeaders = screen.getAllByText("Active");
    expect(activeHeaders.length).toBeGreaterThanOrEqual(1);
    const completeHeaders = screen.getAllByText("Complete");
    expect(completeHeaders.length).toBeGreaterThanOrEqual(1);
    // Both milestones visible
    expect(screen.getByText(/M001/)).toBeInTheDocument();
    expect(screen.getByText(/M002/)).toBeInTheDocument();
  });

  it("clicking Active filter hides completed milestones", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MilestonesPage />);
    const filterBar = getFilterBar();

    // Click the Active filter button inside the filter bar
    await user.click(filterBar.getByRole("button", { name: /^Active/i }));

    // M002 (in-progress) should be visible, M001 (done) should not
    expect(screen.getByText(/M002/)).toBeInTheDocument();
    expect(screen.queryByText(/M001/)).not.toBeInTheDocument();
  });

  it("clicking Complete filter hides active milestones", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MilestonesPage />);
    const filterBar = getFilterBar();

    await user.click(filterBar.getByRole("button", { name: /^Complete/i }));

    expect(screen.getByText(/M001/)).toBeInTheDocument();
    expect(screen.queryByText(/M002/)).not.toBeInTheDocument();
  });

  it("clicking All filter shows all milestones again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MilestonesPage />);
    const filterBar = getFilterBar();

    // Filter to Active, then back to All
    await user.click(filterBar.getByRole("button", { name: /^Active/i }));
    expect(screen.queryByText(/M001/)).not.toBeInTheDocument();

    await user.click(filterBar.getByRole("button", { name: /^All/i }));
    expect(screen.getByText(/M001/)).toBeInTheDocument();
    expect(screen.getByText(/M002/)).toBeInTheDocument();
  });

  it("does not render filter bar when no project is selected", () => {
    mockUseProjectStore.mockImplementation((selector: (s: unknown) => unknown) => {
      return selector({ activeProject: null, projects: [], isLoading: false, error: null });
    });
    mockUseMilestoneData.mockReturnValue({
      milestones: [],
      costData: { totalCost: 0, budgetCeiling: null, byPhase: [], byModel: [], bySlice: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MilestonesPage />);
    expect(
      screen.queryByRole("group", { name: /filter milestones/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render filter bar in loading state", () => {
    mockUseMilestoneData.mockReturnValue({
      milestones: [],
      costData: { totalCost: 0, budgetCeiling: null, byPhase: [], byModel: [], bySlice: [] },
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<MilestonesPage />);
    expect(
      screen.queryByRole("group", { name: /filter milestones/i }),
    ).not.toBeInTheDocument();
  });
});
