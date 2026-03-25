// ---------------------------------------------------------------------------
// Tauri API mock helper for Vitest
// Provides reusable mocks for @tauri-apps/api/core (invoke) and
// @tauri-apps/api/event (listen). Import and call mockTauriApi() at the
// top of any test file that exercises code importing from @tauri-apps/api.
// ---------------------------------------------------------------------------

import { vi } from "vitest";

export interface TauriMocks {
  /** Mock for `invoke()` from `@tauri-apps/api/core`. */
  mockInvoke: ReturnType<typeof vi.fn>;
  /** Mock for `listen()` from `@tauri-apps/api/event`. */
  mockListen: ReturnType<typeof vi.fn>;
}

/**
 * Create hoisted mock functions for Tauri API modules and register vi.mock()
 * factories that reference them.
 *
 * Usage (at the top of a test file, outside describe/it):
 * ```ts
 * import { setupTauriMocks } from "@/test/tauri-mock";
 * const { mockInvoke, mockListen } = setupTauriMocks();
 * ```
 *
 * The returned mock functions can be configured per-test with
 * `mockInvoke.mockResolvedValue(...)` etc. Reset them in `beforeEach`.
 */
export function setupTauriMocks(): TauriMocks {
  // vi.hoisted() ensures these are available when vi.mock factories execute
  const { mockInvoke, mockListen } = vi.hoisted(() => ({
    mockInvoke: vi.fn(),
    mockListen: vi.fn(),
  }));

  vi.mock("@tauri-apps/api/core", () => ({
    invoke: mockInvoke,
  }));

  vi.mock("@tauri-apps/api/event", () => ({
    listen: mockListen,
  }));

  return { mockInvoke, mockListen };
}

// Keep backward-compatible alias
export const mockTauriApi = setupTauriMocks;
