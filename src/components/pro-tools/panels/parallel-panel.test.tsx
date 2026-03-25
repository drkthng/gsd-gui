import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ParallelPanel } from "./parallel-panel";

describe("ParallelPanel", () => {
  it("renders the panel title", () => {
    render(<ParallelPanel />);
    expect(screen.getByText("Parallel Orchestration")).toBeInTheDocument();
  });

  it("shows running and queued counts", () => {
    render(<ParallelPanel />);
    expect(screen.getByTestId("running-count")).toHaveTextContent("2 running");
    expect(screen.getByTestId("queued-count")).toHaveTextContent("1 queued");
  });

  it("renders all mock sessions", () => {
    render(<ParallelPanel />);
    expect(screen.getByTestId("session-s1")).toBeInTheDocument();
    expect(screen.getByTestId("session-s2")).toBeInTheDocument();
    expect(screen.getByTestId("session-s3")).toBeInTheDocument();
    expect(screen.getByTestId("session-s4")).toBeInTheDocument();
    expect(screen.getByTestId("session-s5")).toBeInTheDocument();
  });

  it("displays agent names and task descriptions", () => {
    render(<ParallelPanel />);
    expect(screen.getByText("worker-1")).toBeInTheDocument();
    expect(screen.getByText("Implement auth middleware")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<ParallelPanel />);
    expect(screen.getAllByText("running")).toHaveLength(2);
    expect(screen.getByText("queued")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});
