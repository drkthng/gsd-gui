import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "../project-card";
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
});
