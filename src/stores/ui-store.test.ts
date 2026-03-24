import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/ui-store";

describe("useUIStore", () => {
  beforeEach(() => {
    // Reset only data properties — don't replace the whole state (which would drop action functions)
    useUIStore.setState({
      theme: "system",
      sidebarOpen: true,
      activeView: "chat",
    });
  });

  describe("initial state", () => {
    it('has theme set to "system"', () => {
      expect(useUIStore.getState().theme).toBe("system");
    });

    it("has sidebarOpen set to true", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('has activeView set to "chat"', () => {
      expect(useUIStore.getState().activeView).toBe("chat");
    });
  });

  describe("setTheme", () => {
    it('changes theme to "dark"', () => {
      useUIStore.getState().setTheme("dark");
      expect(useUIStore.getState().theme).toBe("dark");
    });

    it('changes theme to "light"', () => {
      useUIStore.getState().setTheme("light");
      expect(useUIStore.getState().theme).toBe("light");
    });

    it('changes theme back to "system"', () => {
      useUIStore.getState().setTheme("dark");
      useUIStore.getState().setTheme("system");
      expect(useUIStore.getState().theme).toBe("system");
    });
  });

  describe("toggleSidebar", () => {
    it("flips sidebarOpen from true to false", () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(false);
    });

    it("flips sidebarOpen back to true on second toggle", () => {
      useUIStore.getState().toggleSidebar();
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe("setActiveView", () => {
    it('changes activeView to "projects"', () => {
      useUIStore.getState().setActiveView("projects");
      expect(useUIStore.getState().activeView).toBe("projects");
    });

    it('changes activeView to "milestones"', () => {
      useUIStore.getState().setActiveView("milestones");
      expect(useUIStore.getState().activeView).toBe("milestones");
    });

    it('changes activeView to "settings"', () => {
      useUIStore.getState().setActiveView("settings");
      expect(useUIStore.getState().activeView).toBe("settings");
    });
  });
});
