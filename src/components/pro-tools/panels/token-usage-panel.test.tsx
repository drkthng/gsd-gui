import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TokenUsagePanel } from "./token-usage-panel";

describe("TokenUsagePanel", () => {
  it("renders the panel title", () => {
    render(<TokenUsagePanel />);
    expect(screen.getByText("Token Usage")).toBeInTheDocument();
  });

  it("renders all mock token records", () => {
    render(<TokenUsagePanel />);
    expect(screen.getByTestId("token-t1")).toBeInTheDocument();
    expect(screen.getByTestId("token-t2")).toBeInTheDocument();
    expect(screen.getByTestId("token-t3")).toBeInTheDocument();
    expect(screen.getByTestId("token-t4")).toBeInTheDocument();
  });

  it("shows cost badges", () => {
    render(<TokenUsagePanel />);
    expect(screen.getByText("$0.078")).toBeInTheDocument();
    expect(screen.getByText("$0.054")).toBeInTheDocument();
  });

  it("displays model names and metrics", () => {
    render(<TokenUsagePanel />);
    expect(screen.getByText("claude-3.5-sonnet")).toBeInTheDocument();
    expect(screen.getByText(/In: 12.400|In: 12,400|In: 12400/)).toBeInTheDocument();
  });
});
