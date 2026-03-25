import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

describe("ProToolPanel", () => {
  it("renders loading state", () => {
    render(<ProToolPanel title="Test Panel" status="loading" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading test panel/i)).toBeInTheDocument();
  });

  it("renders error state with message and retry button", () => {
    const onRetry = vi.fn();
    render(
      <ProToolPanel title="Test Panel" status="error" errorMessage="Connection failed" onRetry={onRetry} />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
    screen.getByRole("button", { name: /retry/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders error state with default message when no errorMessage", () => {
    render(<ProToolPanel title="Test Panel" status="error" />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<ProToolPanel title="Test Panel" status="empty" />);
    expect(screen.getByTestId("panel-empty")).toBeInTheDocument();
    expect(screen.getByText("No data available.")).toBeInTheDocument();
  });

  it("renders children in ready state", () => {
    render(
      <ProToolPanel title="Test Panel" status="ready">
        <p>Panel content</p>
      </ProToolPanel>,
    );
    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });

  it("does not render children in non-ready states", () => {
    render(
      <ProToolPanel title="Test Panel" status="loading">
        <p>Hidden content</p>
      </ProToolPanel>,
    );
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });
});
