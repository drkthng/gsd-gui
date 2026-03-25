import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { NewProjectWizard } from "../new-project-wizard";

const { mockClient } = vi.hoisted(() => {
  const mockClient = {
    startSession: vi.fn().mockResolvedValue(undefined),
    stopSession: vi.fn(),
    sendCommand: vi.fn().mockResolvedValue(undefined),
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(), onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  };
  return { mockClient };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => mockClient,
}));

describe("NewProjectWizard", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 1 with name and path inputs", () => {
    renderWithProviders(<NewProjectWizard open onClose={onClose} />);
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/folder path/i)).toBeInTheDocument();
  });

  it("validates project name is required", async () => {
    renderWithProviders(<NewProjectWizard open onClose={onClose} />);
    const nextBtn = screen.getByRole("button", { name: /next/i });
    await userEvent.click(nextBtn);
    // Should still be on step 1
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it("navigates to step 2 when name and path provided", async () => {
    renderWithProviders(<NewProjectWizard open onClose={onClose} />);
    await userEvent.type(screen.getByLabelText(/project name/i), "My Project");
    await userEvent.type(screen.getByLabelText(/folder path/i), "/projects/my-project");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
  });

  it("navigates back from step 2 to step 1", async () => {
    renderWithProviders(<NewProjectWizard open onClose={onClose} />);
    await userEvent.type(screen.getByLabelText(/project name/i), "Test");
    await userEvent.type(screen.getByLabelText(/folder path/i), "/test");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/step 2/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText(/step 1/i)).toBeInTheDocument();
  });

  it("shows step 3 summary with create button", async () => {
    renderWithProviders(<NewProjectWizard open onClose={onClose} />);
    // Step 1
    await userEvent.type(screen.getByLabelText(/project name/i), "My Project");
    await userEvent.type(screen.getByLabelText(/folder path/i), "/projects/my-project");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    // Step 2 — skip optional fields
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    // Step 3
    expect(screen.getByText(/step 3/i)).toBeInTheDocument();
    expect(screen.getByText("My Project")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    renderWithProviders(<NewProjectWizard open onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
