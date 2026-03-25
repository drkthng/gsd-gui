import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { ConfigPanel } from "../config-panel";

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

describe("ConfigPanel", () => {
  it("renders General tab by default", () => {
    renderWithProviders(<ConfigPanel />);
    expect(screen.getByText("Token Profile")).toBeInTheDocument();
  });

  it("switches to Models tab", async () => {
    renderWithProviders(<ConfigPanel />);
    await userEvent.click(screen.getByRole("tab", { name: /models/i }));
    expect(screen.getByText("Research Model")).toBeInTheDocument();
  });

  it("switches to Git tab", async () => {
    renderWithProviders(<ConfigPanel />);
    await userEvent.click(screen.getByRole("tab", { name: /git/i }));
    expect(screen.getByText("Isolation Mode")).toBeInTheDocument();
  });

  it("switches to Budget tab", async () => {
    renderWithProviders(<ConfigPanel />);
    await userEvent.click(screen.getByRole("tab", { name: /budget/i }));
    expect(screen.getByText(/Budget Ceiling/)).toBeInTheDocument();
  });

  it("renders all tab triggers", () => {
    renderWithProviders(<ConfigPanel />);
    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /models/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /git/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /budget/i })).toBeInTheDocument();
  });
});
