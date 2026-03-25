import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TraceViewerPanel } from "./trace-viewer-panel";

describe("TraceViewerPanel", () => {
  it("renders the panel title", () => {
    render(<TraceViewerPanel />);
    expect(screen.getByText("Trace Viewer")).toBeInTheDocument();
  });

  it("renders all mock traces", () => {
    render(<TraceViewerPanel />);
    expect(screen.getByTestId("trace-t1")).toBeInTheDocument();
    expect(screen.getByTestId("trace-t2")).toBeInTheDocument();
    expect(screen.getByTestId("trace-t3")).toBeInTheDocument();
    expect(screen.getByTestId("trace-t4")).toBeInTheDocument();
    expect(screen.getByTestId("trace-t5")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<TraceViewerPanel />);
    expect(screen.getAllByText("ok")).toHaveLength(3);
    expect(screen.getByText("error")).toBeInTheDocument();
    expect(screen.getByText("timeout")).toBeInTheDocument();
  });

  it("displays operation names and span counts", () => {
    render(<TraceViewerPanel />);
    expect(screen.getByText("agent.plan")).toBeInTheDocument();
    expect(screen.getByText(/8 spans/)).toBeInTheDocument();
  });
});
