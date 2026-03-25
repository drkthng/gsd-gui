import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { WorktreePanel } from "./worktree-panel";

describe("WorktreePanel", () => {
  it("renders the panel title", () => {
    render(<WorktreePanel />);
    expect(screen.getByText("Worktree Manager")).toBeInTheDocument();
  });

  it("renders all mock worktrees", () => {
    render(<WorktreePanel />);
    expect(screen.getByTestId("worktree-w1")).toBeInTheDocument();
    expect(screen.getByTestId("worktree-w2")).toBeInTheDocument();
    expect(screen.getByTestId("worktree-w3")).toBeInTheDocument();
    expect(screen.getByTestId("worktree-w4")).toBeInTheDocument();
  });

  it("displays branch names and paths", () => {
    render(<WorktreePanel />);
    expect(screen.getByText("feat/pro-tools")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText(".gsd/worktrees/M005")).toBeInTheDocument();
  });

  it("shows milestone labels where present", () => {
    render(<WorktreePanel />);
    expect(screen.getByText("Milestone: M005")).toBeInTheDocument();
    expect(screen.getByText("Milestone: M003")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<WorktreePanel />);
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getAllByText("clean")).toHaveLength(2);
    expect(screen.getByText("dirty")).toBeInTheDocument();
  });
});
