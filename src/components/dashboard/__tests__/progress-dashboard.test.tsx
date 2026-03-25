import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { ProgressDashboard } from "../progress-dashboard";
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

describe("ProgressDashboard", () => {
  it("renders milestone titles", () => {
    renderWithProviders(<ProgressDashboard milestones={mockMilestones} />);
    expect(screen.getByText("M001: Project Scaffolding")).toBeInTheDocument();
    expect(screen.getByText("M002: Backend Bridge")).toBeInTheDocument();
  });

  it("shows completion indicators for done milestones", () => {
    renderWithProviders(<ProgressDashboard milestones={mockMilestones} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows in-progress indicator", () => {
    renderWithProviders(<ProgressDashboard milestones={mockMilestones} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("expands milestone to show slices", async () => {
    renderWithProviders(<ProgressDashboard milestones={mockMilestones} />);
    // Click to expand M001
    await userEvent.click(screen.getByText("M001: Project Scaffolding"));
    expect(screen.getByText("S01: Vite + Tauri scaffold")).toBeInTheDocument();
    expect(screen.getByText("S02: shadcn/ui setup")).toBeInTheDocument();
  });

  it("shows empty state when no milestones", () => {
    renderWithProviders(<ProgressDashboard milestones={[]} />);
    expect(screen.getByText(/no milestones/i)).toBeInTheDocument();
  });

  it("shows cost per milestone", () => {
    renderWithProviders(<ProgressDashboard milestones={mockMilestones} />);
    expect(screen.getByText("$2.40")).toBeInTheDocument();
    expect(screen.getByText("$3.10")).toBeInTheDocument();
  });
});
