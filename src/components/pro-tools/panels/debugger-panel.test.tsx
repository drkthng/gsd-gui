import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DebuggerPanel } from "./debugger-panel";

describe("DebuggerPanel", () => {
  it("renders the panel title", () => {
    render(<DebuggerPanel />);
    expect(screen.getByText("Debugger")).toBeInTheDocument();
  });

  it("renders all mock debug sessions", () => {
    render(<DebuggerPanel />);
    expect(screen.getByTestId("debug-d1")).toBeInTheDocument();
    expect(screen.getByTestId("debug-d2")).toBeInTheDocument();
    expect(screen.getByTestId("debug-d3")).toBeInTheDocument();
    expect(screen.getByTestId("debug-d4")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<DebuggerPanel />);
    expect(screen.getAllByText("paused")).toHaveLength(2);
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("stopped")).toBeInTheDocument();
  });

  it("displays agent names and current steps", () => {
    render(<DebuggerPanel />);
    expect(screen.getByText("planner-1")).toBeInTheDocument();
    expect(screen.getByText("Evaluating tool selection")).toBeInTheDocument();
  });
});
