import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { BenchmarksPanel } from "./benchmarks-panel";

describe("BenchmarksPanel", () => {
  it("renders the panel title", () => {
    render(<BenchmarksPanel />);
    expect(screen.getByText("Benchmarks")).toBeInTheDocument();
  });

  it("renders all mock benchmarks", () => {
    render(<BenchmarksPanel />);
    expect(screen.getByTestId("bench-b1")).toBeInTheDocument();
    expect(screen.getByTestId("bench-b2")).toBeInTheDocument();
    expect(screen.getByTestId("bench-b3")).toBeInTheDocument();
    expect(screen.getByTestId("bench-b4")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<BenchmarksPanel />);
    expect(screen.getAllByText("passed")).toHaveLength(2);
    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("displays benchmark names and metrics", () => {
    render(<BenchmarksPanel />);
    expect(screen.getByText("Tool Selection Latency")).toBeInTheDocument();
    expect(screen.getByText("142ms · Score: 95")).toBeInTheDocument();
  });
});
