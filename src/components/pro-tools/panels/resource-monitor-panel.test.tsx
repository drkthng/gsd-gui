import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ResourceMonitorPanel } from "./resource-monitor-panel";

describe("ResourceMonitorPanel", () => {
  it("renders the panel title", () => {
    render(<ResourceMonitorPanel />);
    expect(screen.getByText("Resource Monitor")).toBeInTheDocument();
  });

  it("renders all mock resources", () => {
    render(<ResourceMonitorPanel />);
    expect(screen.getByTestId("resource-r1")).toBeInTheDocument();
    expect(screen.getByTestId("resource-r2")).toBeInTheDocument();
    expect(screen.getByTestId("resource-r3")).toBeInTheDocument();
    expect(screen.getByTestId("resource-r4")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<ResourceMonitorPanel />);
    expect(screen.getAllByText("healthy")).toHaveLength(2);
    expect(screen.getByText("warning")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
  });

  it("displays resource names and usage", () => {
    render(<ResourceMonitorPanel />);
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("Usage: 34%")).toBeInTheDocument();
  });
});
