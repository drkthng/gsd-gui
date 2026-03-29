import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard, formatRelativeTime } from "../project-card";
import type { SavedProject } from "@/lib/types";

const mockProject: SavedProject = {
  id: "proj_1",
  name: "gsd-gui",
  path: "/projects/gsd-gui",
  description: "A desktop GUI for GSD",
  addedAt: "1234567890",
};

describe("ProjectCard", () => {
  it("renders project name and path", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    expect(screen.getByText("/projects/gsd-gui")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("A desktop GUI for GSD")).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    const noDesc = { ...mockProject, description: null };
    render(<ProjectCard project={noDesc} onClick={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByText("A desktop GUI for GSD")).not.toBeInTheDocument();
  });

  it("calls onClick when card is clicked", async () => {
    const onClick = vi.fn();
    render(<ProjectCard project={mockProject} onClick={onClick} onRemove={vi.fn()} />);
    await userEvent.click(screen.getByText("gsd-gui"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const onRemove = vi.fn();
    const onClick = vi.fn();
    render(<ProjectCard project={mockProject} onClick={onClick} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: /remove gsd-gui/i }));
    expect(onRemove).toHaveBeenCalledOnce();
    // Should not propagate to card onClick
    expect(onClick).not.toHaveBeenCalled();
  });

  // --- Live data props ---

  it("renders milestone badge when currentMilestone is provided", () => {
    render(
      <ProjectCard
        project={mockProject}
        onClick={vi.fn()}
        onRemove={vi.fn()}
        currentMilestone="M003"
      />,
    );
    expect(screen.getByTestId("milestone-badge")).toBeInTheDocument();
    expect(screen.getByTestId("milestone-badge")).toHaveTextContent("M003");
  });

  it("does not render milestone badge when currentMilestone is null", () => {
    render(
      <ProjectCard
        project={mockProject}
        onClick={vi.fn()}
        onRemove={vi.fn()}
        currentMilestone={null}
      />,
    );
    expect(screen.queryByTestId("milestone-badge")).not.toBeInTheDocument();
  });

  it("renders formatted cost when totalCost is non-zero", () => {
    render(
      <ProjectCard
        project={mockProject}
        onClick={vi.fn()}
        onRemove={vi.fn()}
        totalCost={10.4}
      />,
    );
    expect(screen.getByTestId("live-cost")).toHaveTextContent("$10.40");
  });

  it("renders relative last-activity text when lastActivity is provided", () => {
    // Use a timestamp 2 days ago
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    render(
      <ProjectCard
        project={mockProject}
        onClick={vi.fn()}
        onRemove={vi.fn()}
        lastActivity={twoDaysAgo}
      />,
    );
    expect(screen.getByTestId("live-last-activity")).toHaveTextContent("2 days ago");
  });

  it("shows loading indicator when isLiveDataLoading is true", () => {
    render(
      <ProjectCard
        project={mockProject}
        onClick={vi.fn()}
        onRemove={vi.fn()}
        isLiveDataLoading={true}
      />,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("does not crash and renders normally when all live data props are undefined (backward-compatible)", () => {
    render(<ProjectCard project={mockProject} onClick={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("gsd-gui")).toBeInTheDocument();
    expect(screen.queryByTestId("milestone-badge")).not.toBeInTheDocument();
    expect(screen.queryByTestId("live-cost")).not.toBeInTheDocument();
    expect(screen.queryByTestId("live-last-activity")).not.toBeInTheDocument();
  });

  it("hides live stats row when all live data props are null and not loading", () => {
    render(
      <ProjectCard
        project={mockProject}
        onClick={vi.fn()}
        onRemove={vi.fn()}
        currentMilestone={null}
        totalCost={null}
        lastActivity={null}
        isLiveDataLoading={false}
      />,
    );
    expect(screen.queryByTestId("live-cost")).not.toBeInTheDocument();
    expect(screen.queryByTestId("live-last-activity")).not.toBeInTheDocument();
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for timestamps less than 60 seconds ago", () => {
    const ts = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("just now");
  });

  it("returns minutes for timestamps 1-59 minutes ago", () => {
    const ts = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("5 minutes ago");
  });

  it("handles singular minute correctly", () => {
    const ts = new Date(Date.now() - 90 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("1 minute ago");
  });

  it("returns hours for timestamps 1-23 hours ago", () => {
    const ts = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("3 hours ago");
  });

  it("returns days for timestamps 1-29 days ago", () => {
    const ts = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("10 days ago");
  });

  it("returns months for timestamps 30+ days ago", () => {
    const ts = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(ts)).toBe("2 months ago");
  });
});
