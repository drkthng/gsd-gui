import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver for jsdom — required by Radix UI Popper/Tooltip (K010)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for jsdom — used by ChatView auto-scroll
Element.prototype.scrollIntoView = function () {};
