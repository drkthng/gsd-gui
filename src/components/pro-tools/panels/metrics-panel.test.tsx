import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { MetricsPanel } from "./metrics-panel";

describe("MetricsPanel", () => {
  it("renders the panel title", () => {
    render(<MetricsPanel />);
    expect(screen.getByText("Metrics")).toBeInTheDocument();
  });

  it("renders all mock metrics", () => {
    render(<MetricsPanel />);
    expect(screen.getByTestId("metric-m1")).toBeInTheDocument();
    expect(screen.getByTestId("metric-m2")).toBeInTheDocument();
    expect(screen.getByTestId("metric-m3")).toBeInTheDocument();
    expect(screen.getByTestId("metric-m4")).toBeInTheDocument();
    expect(screen.getByTestId("metric-m5")).toBeInTheDocument();
  });

  it("shows trend badges", () => {
    render(<MetricsPanel />);
    expect(screen.getAllByText(/↑ up/)).toHaveLength(2);
    expect(screen.getByText(/↓ down/)).toBeInTheDocument();
    expect(screen.getAllByText(/→ stable/)).toHaveLength(2);
  });

  it("displays metric values and units", () => {
    render(<MetricsPanel />);
    expect(screen.getByText("Token Throughput")).toBeInTheDocument();
    expect(screen.getByText("tok/s")).toBeInTheDocument();
  });
});
