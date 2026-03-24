import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { StatusBar } from "./status-bar";

describe("StatusBar", () => {
  it("renders mock milestone context", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByText(/M001/)).toBeInTheDocument();
    expect(screen.getByText(/S01/)).toBeInTheDocument();
    expect(screen.getByText(/T01/)).toBeInTheDocument();
  });

  it("renders mock cost", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
  });

  it("renders mock model name", () => {
    renderWithProviders(<StatusBar />);
    expect(screen.getByText(/Claude Sonnet/)).toBeInTheDocument();
  });

  it("renders as a footer element", () => {
    renderWithProviders(<StatusBar />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });
});
