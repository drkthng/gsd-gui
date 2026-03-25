import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "../empty-state";
import { LoadingState } from "../loading-state";
import { FolderKanban } from "lucide-react";

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(), stopSession: vi.fn(), sendCommand: vi.fn(),
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(), onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  }),
}));

describe("EmptyState", () => {
  it("renders title and description", () => {
    renderWithProviders(
      <EmptyState
        icon={FolderKanban}
        title="No projects"
        description="Create your first project to get started."
      />
    );
    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(screen.getByText("Create your first project to get started.")).toBeInTheDocument();
  });

  it("renders action button when provided", async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <EmptyState
        icon={FolderKanban}
        title="No projects"
        description="Get started."
        actionLabel="Create Project"
        onAction={onClick}
      />
    );
    const btn = screen.getByRole("button", { name: /create project/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders without action button when not provided", () => {
    renderWithProviders(
      <EmptyState icon={FolderKanban} title="Empty" description="Nothing here." />
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("renders with default message", () => {
    renderWithProviders(<LoadingState />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    renderWithProviders(<LoadingState message="Fetching projects…" />);
    expect(screen.getByText("Fetching projects…")).toBeInTheDocument();
  });

  it("has a spinner element", () => {
    renderWithProviders(<LoadingState />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
