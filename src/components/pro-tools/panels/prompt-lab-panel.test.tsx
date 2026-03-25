import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { PromptLabPanel } from "./prompt-lab-panel";

describe("PromptLabPanel", () => {
  it("renders the panel title", () => {
    render(<PromptLabPanel />);
    expect(screen.getByText("Prompt Lab")).toBeInTheDocument();
  });

  it("renders all mock experiments", () => {
    render(<PromptLabPanel />);
    expect(screen.getByTestId("prompt-p1")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-p2")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-p3")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-p4")).toBeInTheDocument();
  });

  it("shows model badges", () => {
    render(<PromptLabPanel />);
    expect(screen.getAllByText("gpt-4o")).toHaveLength(2);
    expect(screen.getAllByText("claude-3")).toHaveLength(2);
  });

  it("displays experiment names and metrics", () => {
    render(<PromptLabPanel />);
    expect(screen.getByText("Chain-of-Thought v2")).toBeInTheDocument();
    expect(screen.getByText("1240 tokens · Score: 91")).toBeInTheDocument();
  });
});
