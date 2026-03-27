import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { RoadmapView } from "../roadmap-view";
import { mockMilestones } from "@/test/mock-data";

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

describe("RoadmapView", () => {
  const slices = mockMilestones[1].slices; // M002 slices

  it("renders slice cards", () => {
    renderWithProviders(<RoadmapView slices={slices} />);
    expect(screen.getByText("Rust process manager")).toBeInTheDocument();
    expect(screen.getByText("Frontend stores")).toBeInTheDocument();
  });

  it("shows risk badges", () => {
    renderWithProviders(<RoadmapView slices={slices} />);
    expect(screen.getByText("high")).toBeInTheDocument();
    expect(screen.getByText("medium")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    renderWithProviders(<RoadmapView slices={slices} />);
    expect(screen.getByText("done")).toBeInTheDocument();
    expect(screen.getByText("in-progress")).toBeInTheDocument();
  });

  it("shows progress per slice", () => {
    renderWithProviders(<RoadmapView slices={slices} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("shows empty state when no slices", () => {
    renderWithProviders(<RoadmapView slices={[]} />);
    expect(screen.getByText(/no slices/i)).toBeInTheDocument();
  });
});

describe("SVG dependency arrows", () => {
  const slicesWithDeps = mockMilestones[1].slices; // S02 depends on S01

  const slicesNoDeps = [
    {
      id: "S01", title: "Alpha", status: "done" as const, risk: "low" as const,
      cost: 0.5, progress: 100, depends: [],
      tasks: [],
    },
    {
      id: "S02", title: "Beta", status: "in-progress" as const, risk: "medium" as const,
      cost: 0.5, progress: 50, depends: [],
      tasks: [],
    },
  ];

  it("renders SVG overlay when any slice has dependencies", () => {
    renderWithProviders(<RoadmapView slices={slicesWithDeps} />);
    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("renders a path element for each dependency pair", () => {
    renderWithProviders(<RoadmapView slices={slicesWithDeps} />);
    const path = document.querySelector("path[data-from='S01'][data-to='S02']");
    expect(path).not.toBeNull();
  });

  it("does not render SVG when no slice has dependencies", () => {
    renderWithProviders(<RoadmapView slices={slicesNoDeps} />);
    expect(document.querySelector("svg")).toBeNull();
  });

  it("path has correct data attributes", () => {
    renderWithProviders(<RoadmapView slices={slicesWithDeps} />);
    const path = document.querySelector("path[data-from='S01'][data-to='S02']");
    expect(path?.getAttribute("data-from")).toBe("S01");
    expect(path?.getAttribute("data-to")).toBe("S02");
  });
});
