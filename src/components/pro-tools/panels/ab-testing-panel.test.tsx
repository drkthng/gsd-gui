import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { AbTestingPanel } from "./ab-testing-panel";

describe("AbTestingPanel", () => {
  it("renders the panel title", () => {
    render(<AbTestingPanel />);
    expect(screen.getByText("A/B Testing")).toBeInTheDocument();
  });

  it("renders all mock tests", () => {
    render(<AbTestingPanel />);
    expect(screen.getByTestId("ab-ab1")).toBeInTheDocument();
    expect(screen.getByTestId("ab-ab2")).toBeInTheDocument();
    expect(screen.getByTestId("ab-ab3")).toBeInTheDocument();
    expect(screen.getByTestId("ab-ab4")).toBeInTheDocument();
  });

  it("shows winner badges", () => {
    render(<AbTestingPanel />);
    expect(screen.getAllByText("Winner: A")).toHaveLength(2);
    expect(screen.getByText("Winner: B")).toBeInTheDocument();
    expect(screen.getByText("Winner: pending")).toBeInTheDocument();
  });

  it("displays test names and variants", () => {
    render(<AbTestingPanel />);
    expect(screen.getByText("Prompt Format")).toBeInTheDocument();
    expect(screen.getByText("A: Markdown vs B: Plain Text")).toBeInTheDocument();
  });
});
