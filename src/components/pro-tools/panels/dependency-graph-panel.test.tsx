import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DependencyGraphPanel } from "./dependency-graph-panel";

describe("DependencyGraphPanel", () => {
  it("renders the panel title", () => {
    render(<DependencyGraphPanel />);
    expect(screen.getByText("Dependency Graph")).toBeInTheDocument();
  });

  it("renders all mock dependencies", () => {
    render(<DependencyGraphPanel />);
    expect(screen.getByTestId("dep-d1")).toBeInTheDocument();
    expect(screen.getByTestId("dep-d2")).toBeInTheDocument();
    expect(screen.getByTestId("dep-d3")).toBeInTheDocument();
    expect(screen.getByTestId("dep-d4")).toBeInTheDocument();
  });

  it("shows type badges", () => {
    render(<DependencyGraphPanel />);
    expect(screen.getAllByText("direct")).toHaveLength(2);
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.getByText("peer")).toBeInTheDocument();
  });

  it("displays dependency details", () => {
    render(<DependencyGraphPanel />);
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("v18.3.1 · 24 dependents")).toBeInTheDocument();
  });
});
