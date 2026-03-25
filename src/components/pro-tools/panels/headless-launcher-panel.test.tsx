import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { HeadlessLauncherPanel } from "./headless-launcher-panel";

describe("HeadlessLauncherPanel", () => {
  it("renders the panel title", () => {
    render(<HeadlessLauncherPanel />);
    expect(screen.getByText("Headless Launcher")).toBeInTheDocument();
  });

  it("renders all mock profiles", () => {
    render(<HeadlessLauncherPanel />);
    expect(screen.getByTestId("profile-p1")).toBeInTheDocument();
    expect(screen.getByTestId("profile-p2")).toBeInTheDocument();
    expect(screen.getByTestId("profile-p3")).toBeInTheDocument();
  });

  it("displays profile names and models", () => {
    render(<HeadlessLauncherPanel />);
    expect(screen.getByText("Code Review Bot")).toBeInTheDocument();
    expect(screen.getByText("Doc Generator")).toBeInTheDocument();
    expect(screen.getByText("gpt-4o")).toBeInTheDocument();
  });

  it("shows launch buttons for each profile", () => {
    render(<HeadlessLauncherPanel />);
    expect(screen.getByLabelText("Launch Code Review Bot")).toBeInTheDocument();
    expect(screen.getByLabelText("Launch Test Writer")).toBeInTheDocument();
    expect(screen.getByLabelText("Launch Doc Generator")).toBeInTheDocument();
  });

  it("shows status badges", () => {
    render(<HeadlessLauncherPanel />);
    expect(screen.getAllByText("idle")).toHaveLength(2);
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});
