import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewProjectWizard } from "../new-project-wizard";
import type { WizardFormData } from "../new-project-wizard";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock openDirectoryPicker / onPickFolder — not invoked through Tauri here;
// the wizard receives it as a prop so we just pass a vi.fn().

// Mock createGsdClient so any transitive imports don't hit Tauri IPC
vi.mock("@/services/gsd-client", () => ({
  createGsdClient: vi.fn().mockReturnValue({}),
}));

// Radix UI Popper uses ResizeObserver — already patched in global setup.
// Radix Dialog uses pointer-events; jsdom doesn't implement them, so patch:
globalThis.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
globalThis.HTMLElement.prototype.setPointerCapture = vi.fn();
globalThis.HTMLElement.prototype.releasePointerCapture = vi.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDefaultProps(overrides?: {
  open?: boolean;
  onSubmit?: (data: WizardFormData) => Promise<void>;
  onPickFolder?: () => Promise<string | null>;
  onOpenChange?: (open: boolean) => void;
}) {
  return {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onPickFolder: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function renderWizard(
  props?: Parameters<typeof makeDefaultProps>[0],
  initialData?: Partial<WizardFormData>,
) {
  const mergedProps = makeDefaultProps(props);
  return {
    ...render(
      <NewProjectWizard {...mergedProps} initialData={initialData} />,
    ),
    props: mergedProps,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NewProjectWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // (a) Wizard renders with step 1 visible
  it("renders with step 1 (name) visible and shows step indicator", () => {
    renderWizard();
    // DialogTitle shows step title — use heading role to be precise
    expect(screen.getByRole("heading", { name: "Project Name" })).toBeInTheDocument();
    // Step indicator
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    // Name input is present — use role to avoid matching the dialog's aria-labelledby
    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  // (b) Next button disabled when name is empty
  it("disables Next when name field is empty", () => {
    renderWizard();
    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).toBeDisabled();
  });

  // Next is enabled once a name is typed
  it("enables Next after user types a project name", async () => {
    renderWizard();
    const input = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "my-app");
    const nextBtn = screen.getByRole("button", { name: /next/i });
    expect(nextBtn).toBeEnabled();
  });

  // (c) Next advances to step 2
  it("advances to step 2 (folder) when Next is clicked", async () => {
    renderWizard();
    const input = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "my-app");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByRole("heading", { name: "Project Folder" })).toBeInTheDocument();
    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();
  });

  // (d) Back returns to previous step
  it("returns to step 1 when Back is clicked from step 2", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "my-app");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    // Now on step 2
    expect(screen.getByRole("heading", { name: "Project Folder" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    // Back on step 1
    expect(screen.getByRole("heading", { name: "Project Name" })).toBeInTheDocument();
  });

  it("Back button is disabled on step 1", () => {
    renderWizard();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  // (e) Step 6 shows Submit button
  it("shows Create Project button on the last step (step 6)", async () => {
    renderWizard();
    // Navigate through all 6 steps
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "demo-project");
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
    }
    expect(screen.getByText(/step 6 of 6/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create project/i }),
    ).toBeInTheDocument();
    // Next should not be visible
    expect(
      screen.queryByRole("button", { name: /^next$/i }),
    ).not.toBeInTheDocument();
  });

  // (f) onSubmit called with complete formData
  it("calls onSubmit with complete formData when Create Project is clicked", async () => {
    const { props } = renderWizard();

    // Step 1 — name
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "my-app");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // Step 2 — folder (skip, no folder picked)
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // Step 3 — type (default "New project" radio)
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // Step 4 — description
    await userEvent.type(
      screen.getByRole("textbox", { name: "Description (optional)" }),
      "Test project",
    );
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // Step 5 — tech stack, pick TypeScript
    await userEvent.click(screen.getByRole("button", { name: "TypeScript" }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    // Step 6 — action, pick "Open dashboard" (default)
    await userEvent.click(
      screen.getByRole("button", { name: /create project/i }),
    );

    await waitFor(() => {
      expect(props.onSubmit).toHaveBeenCalledOnce();
    });

    const submitted: WizardFormData = props.onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe("my-app");
    expect(submitted.description).toBe("Test project");
    expect(submitted.techStack).toContain("TypeScript");
    expect(submitted.type).toBe("new");
    expect(submitted.action).toBe("dashboard");
  });

  // Browse button calls onPickFolder
  it("calls onPickFolder when Browse button is clicked on step 2", async () => {
    const onPickFolder = vi.fn().mockResolvedValue("/home/user/projects");
    renderWizard({ onPickFolder });

    // Navigate to step 2
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "test");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    await userEvent.click(screen.getByRole("button", { name: /browse/i }));
    expect(onPickFolder).toHaveBeenCalledOnce();

    // Selected path appears in the UI after picker resolves
    await waitFor(() => {
      expect(screen.getByText("/home/user/projects")).toBeInTheDocument();
    });
  });

  // Tech stack multi-select toggling
  it("toggles tech-stack selections on step 5", async () => {
    renderWizard();
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "test");
    // Skip to step 5 by clicking Next 4 times
    for (let i = 0; i < 4; i++) {
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    const tsButton = screen.getByRole("button", { name: "TypeScript" });
    expect(tsButton).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(tsButton);
    expect(tsButton).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(tsButton);
    expect(tsButton).toHaveAttribute("aria-pressed", "false");
  });

  // initialData pre-fills the form
  it("pre-fills name field when initialData is provided", () => {
    renderWizard(undefined, { name: "pre-filled" });
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("pre-filled");
  });
});
