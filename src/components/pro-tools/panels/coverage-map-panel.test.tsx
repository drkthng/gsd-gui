import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { CoverageMapPanel } from "./coverage-map-panel";

describe("CoverageMapPanel", () => {
  it("renders the panel title", () => {
    render(<CoverageMapPanel />);
    expect(screen.getByText("Coverage Map")).toBeInTheDocument();
  });

  it("renders all mock coverage entries", () => {
    render(<CoverageMapPanel />);
    expect(screen.getByTestId("cov-c1")).toBeInTheDocument();
    expect(screen.getByTestId("cov-c2")).toBeInTheDocument();
    expect(screen.getByTestId("cov-c3")).toBeInTheDocument();
    expect(screen.getByTestId("cov-c4")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<CoverageMapPanel />);
    expect(screen.getAllByText("covered")).toHaveLength(2);
    expect(screen.getByText("partial")).toBeInTheDocument();
    expect(screen.getByText("uncovered")).toBeInTheDocument();
  });

  it("displays file names and metrics", () => {
    render(<CoverageMapPanel />);
    expect(screen.getByText("src/router.tsx")).toBeInTheDocument();
    expect(screen.getByText("Stmts: 98% · Branches: 92% · Fns: 100%")).toBeInTheDocument();
  });
});
