import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver for jsdom — required by Radix UI Popper/Tooltip (K009)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
