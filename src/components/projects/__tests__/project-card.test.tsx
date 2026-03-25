import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "../project-card";
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

const activeProject: ProjectDisplayInfo = {
  id: "p1",
  name: "gsd-gui",
  path: "/projects/gsd-gui",
  status: "active",
  currentMilestone: "M003",
  totalCost: 4.52,
  progress: 68,
  lastActivity: "2026-03-25T10:00:00Z",
};

const idleProject: ProjectDisplayInfo = {
  id: "p2",
  name: "docs-site",
  path: "/projects/docs-site",
  status: "idle",
  currentMilestone: null,
  totalCost: 0,
  progress: 0,
  lastActivity: null,
};

describe("ProjectCard", () => {
  it("renders project name", () => {
    renderWithProviders(<ProjectCard project={activeProject} onClick={vi.fn()} />);
    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
  });

  it("shows active status indicator", () => {
    renderWithProviders(<ProjectCard project={activeProject} onClick={vi.fn()} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows idle status indicator", () => {
    renderWithProviders(<ProjectCard project={idleProject} onClick={vi.fn()} />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
  });

  it("shows current milestone when present", () => {
    renderWithProviders(<ProjectCard project={activeProject} onClick={vi.fn()} />);
    expect(screen.getByText("M003")).toBeInTheDocument();
  });

  it("shows progress percentage", () => {
    renderWithProviders(<ProjectCard project={activeProject} onClick={vi.fn()} />);
    expect(screen.getByText("68%")).toBeInTheDocument();
  });

  it("shows cost", () => {
    renderWithProviders(<ProjectCard project={activeProject} onClick={vi.fn()} />);
    expect(screen.getByText("$4.52")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    renderWithProviders(<ProjectCard project={activeProject} onClick={onClick} />);
    await userEvent.click(screen.getByText("gsd-gui"));
    expect(onClick).toHaveBeenCalledWith(activeProject);
  });

  it("shows path as tooltip or subtitle", () => {
    renderWithProviders(<ProjectCard project={activeProject} onClick={vi.fn()} />);
    expect(screen.getByText("/projects/gsd-gui")).toBeInTheDocument();
  });
});
