import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { LogViewerPanel } from "./log-viewer-panel";

describe("LogViewerPanel", () => {
  it("renders the panel title", () => {
    render(<LogViewerPanel />);
    expect(screen.getByText("Log Viewer")).toBeInTheDocument();
  });

  it("renders all mock log entries", () => {
    render(<LogViewerPanel />);
    expect(screen.getByTestId("log-l1")).toBeInTheDocument();
    expect(screen.getByTestId("log-l2")).toBeInTheDocument();
    expect(screen.getByTestId("log-l3")).toBeInTheDocument();
    expect(screen.getByTestId("log-l4")).toBeInTheDocument();
    expect(screen.getByTestId("log-l5")).toBeInTheDocument();
  });

  it("shows level badges", () => {
    render(<LogViewerPanel />);
    expect(screen.getAllByText("info")).toHaveLength(3);
    expect(screen.getByText("warn")).toBeInTheDocument();
    expect(screen.getByText("error")).toBeInTheDocument();
  });

  it("displays log messages and sources", () => {
    render(<LogViewerPanel />);
    expect(screen.getByText("Agent worker-1 started task")).toBeInTheDocument();
    expect(screen.getByText("orchestrator")).toBeInTheDocument();
  });
});
