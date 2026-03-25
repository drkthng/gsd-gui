import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { useGsdStore } from "@/stores/gsd-store";
import { useUIStore } from "@/stores/ui-store";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(),
    stopSession: vi.fn(),
    sendCommand: vi.fn(),
    queryState: vi.fn(),
    listProjects: vi.fn(),
    startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(),
    onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  }),
}));

import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  window.dispatchEvent(event);
  return event;
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGsdStore.setState({ sessionState: "idle" });
    useUIStore.setState({ activeView: "chat" });
  });

  it("Ctrl+N navigates to /projects", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("n", { ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith("/projects");
    expect(useUIStore.getState().activeView).toBe("projects");
  });

  it("Ctrl+1 switches to chat", () => {
    useUIStore.setState({ activeView: "settings" });
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("1", { ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith("/chat");
    expect(useUIStore.getState().activeView).toBe("chat");
  });

  it("Ctrl+3 switches to milestones", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("3", { ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith("/milestones");
    expect(useUIStore.getState().activeView).toBe("milestones");
  });

  it("Ctrl+7 switches to pro-tools", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("7", { ctrlKey: true });
    expect(mockNavigate).toHaveBeenCalledWith("/pro-tools");
    expect(useUIStore.getState().activeView).toBe("pro-tools");
  });

  it("Escape disconnects when streaming", () => {
    const mockDisconnect = vi.fn().mockResolvedValue(undefined);
    useGsdStore.setState({ sessionState: "streaming", disconnect: mockDisconnect });
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("Escape");
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("Escape does nothing when not streaming", () => {
    const mockDisconnect = vi.fn();
    useGsdStore.setState({ sessionState: "connected", disconnect: mockDisconnect });
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("Escape");
    expect(mockDisconnect).not.toHaveBeenCalled();
  });

  it("ignores shortcuts when typing in input", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    const input = document.createElement("input");
    document.body.appendChild(input);
    const event = new KeyboardEvent("keydown", {
      key: "n",
      ctrlKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);
    expect(mockNavigate).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("ignores shortcuts when typing in textarea", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    const event = new KeyboardEvent("keydown", {
      key: "n",
      ctrlKey: true,
      bubbles: true,
    });
    textarea.dispatchEvent(event);
    expect(mockNavigate).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("Ctrl+8 does nothing (out of range)", () => {
    renderHook(() => useKeyboardShortcuts(), { wrapper });
    fireKey("8", { ctrlKey: true });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
