import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { StateInspectorPanel } from "./state-inspector-panel";

describe("StateInspectorPanel", () => {
  it("renders the panel title", () => {
    render(<StateInspectorPanel />);
    expect(screen.getByText("State Inspector")).toBeInTheDocument();
  });

  it("renders all mock state entries", () => {
    render(<StateInspectorPanel />);
    expect(screen.getByTestId("state-st1")).toBeInTheDocument();
    expect(screen.getByTestId("state-st2")).toBeInTheDocument();
    expect(screen.getByTestId("state-st3")).toBeInTheDocument();
    expect(screen.getByTestId("state-st4")).toBeInTheDocument();
  });

  it("shows type badges", () => {
    render(<StateInspectorPanel />);
    expect(screen.getByText("string")).toBeInTheDocument();
    expect(screen.getByText("number")).toBeInTheDocument();
    expect(screen.getByText("boolean")).toBeInTheDocument();
    expect(screen.getByText("object")).toBeInTheDocument();
  });

  it("displays keys and values", () => {
    render(<StateInspectorPanel />);
    expect(screen.getByText("currentModel")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-4-20250514")).toBeInTheDocument();
  });
});
