import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectGallery } from "../project-gallery";
import { useProjectStore } from "@/stores/project-store";
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
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
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
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,
    });
  });

  it("shows empty state with import button when no projects", async () => {
    render(<ProjectGallery />);
    await waitFor(() => {
      expect(screen.getByText(/no projects/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /import project/i })).toBeInTheDocument();
  });

  it("renders project cards when projects exist", async () => {
    const projects = [makeProject("p1", "gsd-gui"), makeProject("p2", "other")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    render(<ProjectGallery />);
    await waitFor(() => {
      expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    });
    expect(screen.getByText("other")).toBeInTheDocument();
  });

  it("filters projects by search term", async () => {
    const projects = [makeProject("p1", "gsd-gui"), makeProject("p2", "other")];
    mockClient.getSavedProjects.mockResolvedValue(projects);
    useProjectStore.setState({ projects });

    render(<ProjectGallery />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByPlaceholderText(/search/i), "gsd");
    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    expect(screen.queryByText("other")).not.toBeInTheDocument();
  });

  it("shows error state when error and no projects", async () => {
    mockClient.getSavedProjects.mockRejectedValue(new Error("Something went wrong"));

    render(<ProjectGallery />);
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    useProjectStore.setState({ isLoading: true });
    render(<ProjectGallery />);
    expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
  });
});
