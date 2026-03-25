import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SessionBrowser } from "../session-browser";
import { mockSessions } from "@/test/mock-data";

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

describe("SessionBrowser", () => {
  it("renders session list", () => {
    renderWithProviders(<SessionBrowser sessions={mockSessions} />);
    expect(screen.getByText("Scaffold project")).toBeInTheDocument();
    expect(screen.getByText("Debug CI pipeline")).toBeInTheDocument();
    expect(screen.getByText("Auto mode M002/S03")).toBeInTheDocument();
  });

  it("shows active session indicator", () => {
    renderWithProviders(<SessionBrowser sessions={mockSessions} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows message count", () => {
    renderWithProviders(<SessionBrowser sessions={mockSessions} />);
    expect(screen.getByText("24 msgs")).toBeInTheDocument();
  });

  it("shows cost per session", () => {
    renderWithProviders(<SessionBrowser sessions={mockSessions} />);
    expect(screen.getByText("$1.20")).toBeInTheDocument();
  });

  it("filters sessions by search", async () => {
    renderWithProviders(<SessionBrowser sessions={mockSessions} />);
    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "debug");
    expect(screen.getByText("Debug CI pipeline")).toBeInTheDocument();
    expect(screen.queryByText("Scaffold project")).not.toBeInTheDocument();
  });

  it("shows empty state", () => {
    renderWithProviders(<SessionBrowser sessions={[]} />);
    expect(screen.getByText(/no sessions/i)).toBeInTheDocument();
  });

  it("shows child session indented", () => {
    renderWithProviders(<SessionBrowser sessions={mockSessions} />);
    expect(screen.getByText("Steer: fix test mock")).toBeInTheDocument();
  });
});
