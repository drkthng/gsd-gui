import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ThemePreviewPanel } from "./theme-preview-panel";

describe("ThemePreviewPanel", () => {
  it("renders the panel title", () => {
    render(<ThemePreviewPanel />);
    expect(screen.getByText("Theme Preview")).toBeInTheDocument();
  });

  it("renders all mock themes", () => {
    render(<ThemePreviewPanel />);
    expect(screen.getByTestId("theme-th1")).toBeInTheDocument();
    expect(screen.getByTestId("theme-th2")).toBeInTheDocument();
    expect(screen.getByTestId("theme-th3")).toBeInTheDocument();
    expect(screen.getByTestId("theme-th4")).toBeInTheDocument();
  });

  it("shows mode badges", () => {
    render(<ThemePreviewPanel />);
    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(screen.getAllByText("light")).toHaveLength(2);
    expect(screen.getByText("system")).toBeInTheDocument();
  });

  it("displays theme names and details", () => {
    render(<ThemePreviewPanel />);
    expect(screen.getByText("Default Dark")).toBeInTheDocument();
    expect(screen.getByText("#7c3aed · Active")).toBeInTheDocument();
    expect(screen.getByText("#0ea5e9 · Inactive")).toBeInTheDocument();
  });
});
