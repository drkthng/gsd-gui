import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectGallery } from "../project-gallery";
import { useProjectStore } from "@/stores/project-store";
import { renderWithProviders } from "@/test/test-utils";
import type { SavedProject } from "@/lib/types";

// Mock the Tauri dialog plugin
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

// Mock gsd-client so loadProjects doesn't hit Tauri IPC
const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    getSavedProjects: vi.fn().mockResolvedValue([]),
    addProject: vi.fn(),
    removeProject: vi.fn(),
    startSession: vi.fn(), stopSession: vi.fn(), sendCommand: vi.fn(),
    queryState: vi.fn().mockResolvedValue({ currentMilestone: 'M003', activeTasks: 2, totalCost: 10.40 }),
    listActivity: vi.fn().mockResolvedValue([]),
    listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    parseProjectMilestones: vi.fn().mockResolvedValue([]),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
    initProject: vi.fn().mockResolvedValue(undefined),
    detectProjectMetadata: vi.fn().mockResolvedValue({
      detectedName: null,
      language: null,
      hasGsd: false,
      hasPlanning: false,
      isGit: false,
    }),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

const makeProject = (id: string, name: string): SavedProject => ({
  id,
  name,
  path: `/projects/${name}`,
  description: null,
  addedAt: "1234567890",
});

describe("ProjectGallery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.getSavedProjects.mockResolvedValue([]);
    mockClient.detectProjectMetadata.mockResolvedValue({
      detectedName: null,
      language: null,
      hasGsd: false,
      hasPlanning: false,
      isGit: false,
    });
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("shows empty state with import button when no projects", async () => {
    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /import project/i })).toBeInTheDocument();
  });

  it("renders project cards when projects exist", async () => {
    const projects = [makeProject("p1", "gsd-gui"), makeProject("p2", "other")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    });
    expect(screen.getByText("other")).toBeInTheDocument();
  });

  it("filters projects by search term", async () => {
    const projects = [makeProject("p1", "gsd-gui"), makeProject("p2", "other")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText(/search/i), "gsd");
    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    expect(screen.queryByText("other")).not.toBeInTheDocument();
  });

  it("shows error state when error and no projects", async () => {
    mockClient.getSavedProjects.mockRejectedValue(new Error("Something went wrong"));

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    useProjectStore.setState({ isLoading: true });
    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
  });

  it("navigates to milestones when a project card is clicked", async () => {
    const projects = [makeProject("p1", "gsd-gui")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    const { container } = renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    });

    // Click the project card
    const card = container.querySelector("[class*='cursor-pointer']");
    expect(card).not.toBeNull();
    await userEvent.click(card!);

    // Verify project was selected in the store
    expect(useProjectStore.getState().activeProject?.id).toBe("p1");
  });

  // --- New T03 tests ---

  it("New Project button opens wizard", async () => {
    const projects = [makeProject("p1", "gsd-gui")];
    useProjectStore.setState({ projects });

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /new project/i }));

    // Wizard dialog should open — step 1 heading is visible
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /project name/i })).toBeInTheDocument();
    });
  });

  it("Import of a GSD project skips wizard and navigates directly to milestones", async () => {
    const projects = [makeProject("p1", "gsd-gui")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    const { open } = await import("@tauri-apps/plugin-dialog");
    vi.mocked(open).mockResolvedValueOnce("/home/user/my-gsd-project" as never);

    const savedProject = makeProject("p2", "my-gsd-project");
    mockClient.addProject.mockResolvedValueOnce(savedProject);

    // Detection shows hasGsd: true — this is the fast path
    mockClient.detectProjectMetadata.mockResolvedValueOnce({
      detectedName: "my-gsd-project",
      language: null,
      hasGsd: true,
      hasPlanning: false,
      isGit: true,
    });

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^import$/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));

    // Wizard must NOT have opened
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /project name/i })).not.toBeInTheDocument();
    });

    // addProject called directly with the path, no wizard steps needed
    await waitFor(() => {
      expect(mockClient.addProject).toHaveBeenCalledWith("/home/user/my-gsd-project", undefined);
    });

    // Project selected and navigated away
    await waitFor(() => {
      expect(useProjectStore.getState().activeProject?.id).toBe("p2");
    });
  });

  it("Import of a non-GSD project opens wizard pre-filled with detected metadata", async () => {
    const projects = [makeProject("p1", "gsd-gui")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    // Mock folder picker to return a path
    const { open } = await import("@tauri-apps/plugin-dialog");
    vi.mocked(open).mockResolvedValueOnce("/home/user/my-app" as never);

    // Detection returns hasGsd: false — wizard needed
    mockClient.detectProjectMetadata.mockResolvedValueOnce({
      detectedName: "my-app",
      language: "TypeScript",
      hasGsd: false,
      hasPlanning: false,
      isGit: true,
    });

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^import$/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /^import$/i }));

    // Wizard should open pre-filled with "my-app"
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /project name/i })).toBeInTheDocument();
    });

    // The name field should be pre-filled
    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("my-app");
    });
  });

  it("wizard submit calls initProject for new project and navigates to /milestones", async () => {
    const projects = [makeProject("p1", "gsd-gui")];
    useProjectStore.setState({ projects });

    const savedProject = makeProject("p2", "new-project");
    mockClient.addProject.mockResolvedValueOnce(savedProject);
    mockClient.getSavedProjects.mockResolvedValue([...projects, savedProject]);

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new project/i })).toBeInTheDocument();
    });

    // Open wizard in "new" mode
    await userEvent.click(screen.getByRole("button", { name: /new project/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /project name/i })).toBeInTheDocument();
    });

    // Fill in name and navigate through all 6 steps
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "new-project");
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    // Submit
    await userEvent.click(screen.getByRole("button", { name: /create project/i }));

    await waitFor(() => {
      expect(mockClient.initProject).toHaveBeenCalled();
      expect(mockClient.addProject).toHaveBeenCalled();
    });

    // Check navigation happened — activeProject set means selectProject was called
    await waitFor(() => {
      expect(useProjectStore.getState().activeProject?.id).toBe("p2");
    });
  });

  it("renders milestone badge in project cards when live data resolves", async () => {
    const projects = [makeProject("p1", "gsd-gui")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    mockClient.queryState.mockResolvedValue({ currentMilestone: "M003", activeTasks: 2, totalCost: 10.40 });
    mockClient.listActivity.mockResolvedValue([]);
    useProjectStore.setState({ projects });

    renderWithProviders(<ProjectGallery />, { initialRoute: "/projects" });

    // Wait for the milestone badge to appear (live data resolves asynchronously)
    await waitFor(() => {
      expect(screen.getByTestId("milestone-badge")).toBeInTheDocument();
    });
    expect(screen.getByTestId("milestone-badge")).toHaveTextContent("M003");
  });
});
