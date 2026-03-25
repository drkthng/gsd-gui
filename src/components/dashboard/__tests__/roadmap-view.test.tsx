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
