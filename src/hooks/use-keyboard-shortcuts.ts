import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/stores/ui-store";
import { useGsdStore } from "@/stores/gsd-store";

/**
 * View keys in sidebar nav order for Ctrl+1 through Ctrl+7.
 */
const VIEW_ORDER = [
  "chat",
  "projects",
  "milestones",
  "timeline",
  "costs",
  "settings",
  "pro-tools",
] as const;

const PATH_MAP: Record<string, string> = {
  chat: "/chat",
  projects: "/projects",
  milestones: "/milestones",
  timeline: "/timeline",
  costs: "/costs",
  settings: "/settings",
  "pro-tools": "/pro-tools",
};

/**
 * Global keyboard shortcuts:
 * - Ctrl+N → navigate to /projects (new project)
 * - Ctrl+1..7 → switch to sidebar tab by index
 * - Escape → disconnect if session is streaming
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const setActiveView = useUIStore((s) => s.setActiveView);
  const sessionState = useGsdStore((s) => s.sessionState);
  const disconnect = useGsdStore((s) => s.disconnect);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+N → new project
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate("/projects");
        setActiveView("projects");
        return;
      }

      // Ctrl+1..7 → switch tabs
      if (e.ctrlKey && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        const view = VIEW_ORDER[index];
        if (view) {
          navigate(PATH_MAP[view]);
          setActiveView(view);
        }
        return;
      }

      // Escape → disconnect if streaming
      if (e.key === "Escape" && sessionState === "streaming") {
        e.preventDefault();
        disconnect();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, setActiveView, sessionState, disconnect]);
}
