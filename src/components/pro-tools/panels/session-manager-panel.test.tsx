import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { SessionManagerPanel } from "./session-manager-panel";

describe("SessionManagerPanel", () => {
  it("renders the panel title", () => {
    render(<SessionManagerPanel />);
    expect(screen.getByText("Session Manager")).toBeInTheDocument();
  });

  it("renders all mock sessions", () => {
    render(<SessionManagerPanel />);
    expect(screen.getByTestId("session-s1")).toBeInTheDocument();
    expect(screen.getByTestId("session-s2")).toBeInTheDocument();
    expect(screen.getByTestId("session-s3")).toBeInTheDocument();
    expect(screen.getByTestId("session-s4")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<SessionManagerPanel />);
    expect(screen.getAllByText("active")).toHaveLength(2);
    expect(screen.getByText("idle")).toBeInTheDocument();
    expect(screen.getByText("terminated")).toBeInTheDocument();
  });

  it("displays session names and start times", () => {
    render(<SessionManagerPanel />);
    expect(screen.getByText("planner-main")).toBeInTheDocument();
    expect(screen.getByText("Started: 2026-03-25T10:00:00Z")).toBeInTheDocument();
  });
});
