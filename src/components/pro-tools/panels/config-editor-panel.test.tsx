import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ConfigEditorPanel } from "./config-editor-panel";

describe("ConfigEditorPanel", () => {
  it("renders the panel title", () => {
    render(<ConfigEditorPanel />);
    expect(screen.getByText("Config Editor")).toBeInTheDocument();
  });

  it("renders all mock config items", () => {
    render(<ConfigEditorPanel />);
    expect(screen.getByTestId("config-cfg1")).toBeInTheDocument();
    expect(screen.getByTestId("config-cfg2")).toBeInTheDocument();
    expect(screen.getByTestId("config-cfg3")).toBeInTheDocument();
    expect(screen.getByTestId("config-cfg4")).toBeInTheDocument();
  });

  it("shows category badges", () => {
    render(<ConfigEditorPanel />);
    expect(screen.getByText("agent")).toBeInTheDocument();
    expect(screen.getAllByText("project")).toHaveLength(2);
    expect(screen.getByText("system")).toBeInTheDocument();
  });

  it("displays config keys and values", () => {
    render(<ConfigEditorPanel />);
    expect(screen.getByText("defaultModel")).toBeInTheDocument();
    expect(screen.getByText("claude-sonnet-4-20250514")).toBeInTheDocument();
  });
});
