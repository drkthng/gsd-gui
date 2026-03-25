import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { ProjectGallery } from "../project-gallery";
import { useProjectStore } from "@/stores/project-store";
import type { ProjectDisplayInfo } from "@/lib/types";

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(), stopSession: vi.fn(), sendCommand: vi.fn(),
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(), onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  }),
}));

const mockProjects: ProjectDisplayInfo[] = [
  { id: "p1", name: "gsd-gui", path: "/gsd-gui", status: "active", currentMilestone: "M003", totalCost: 4.52, progress: 68, lastActivity: "2026-03-25T10:00:00Z" },
  { id: "p2", name: "api-server", path: "/api-server", status: "paused", currentMilestone: "M001", totalCost: 1.20, progress: 30, lastActivity: "2026-03-24T08:00:00Z" },
  { id: "p3", name: "docs-site", path: "/docs-site", status: "idle", currentMilestone: null, totalCost: 0, progress: 0, lastActivity: null },
];

describe("ProjectGallery", () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("shows empty state when no projects", () => {
    renderWithProviders(<ProjectGallery />);
    expect(screen.getByText(/no projects/i)).toBeInTheDocument();
  });

  it("shows loading state when loading", () => {
    useProjectStore.setState({ isLoading: true });
    renderWithProviders(<ProjectGallery />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders project cards from store", () => {
    useProjectStore.setState({ projects: mockProjects });
    renderWithProviders(<ProjectGallery />);
    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    expect(screen.getByText("api-server")).toBeInTheDocument();
    expect(screen.getByText("docs-site")).toBeInTheDocument();
  });

  it("filters projects by search query", async () => {
    useProjectStore.setState({ projects: mockProjects });
    renderWithProviders(<ProjectGallery />);

    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "gsd");

    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    expect(screen.queryByText("api-server")).not.toBeInTheDocument();
    expect(screen.queryByText("docs-site")).not.toBeInTheDocument();
  });

  it("shows error state", () => {
    useProjectStore.setState({ error: "Failed to load" });
    renderWithProviders(<ProjectGallery />);
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it("clicking card calls selectProject", async () => {
    useProjectStore.setState({ projects: mockProjects });
    renderWithProviders(<ProjectGallery />);
    await userEvent.click(screen.getByText("gsd-gui"));
    expect(useProjectStore.getState().activeProject?.id).toBe("p1");
  });
});
