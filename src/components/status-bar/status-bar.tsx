import { Badge } from "@/components/ui/badge";
import { useGsdStore } from "@/stores/gsd-store";
import { useProjectStore } from "@/stores/project-store";
import { useGsdState } from "@/hooks/use-gsd-state";
import { NotificationPopover } from "./notification-popover";

/**
 * Status bar displayed at the bottom of the app shell.
 * Shows current milestone context, accumulated cost, active model, and session state.
 * Reads from Zustand stores and TanStack Query for live data.
 */
export function StatusBar() {
  const sessionState = useGsdStore((s) => s.sessionState);
  const activeProject = useProjectStore((s) => s.activeProject);
  const { data: snapshot } = useGsdState(activeProject?.path ?? null);

  const milestone = snapshot?.currentMilestone ?? "—";
  const cost = snapshot?.totalCost ?? 0;

  const stateLabel: Record<string, string> = {
    idle: "Idle",
    connecting: "Connecting…",
    connected: "Connected",
    streaming: "Streaming",
    disconnected: "Disconnected",
    error: "Error",
  };

  return (
    <footer
      role="contentinfo"
      className="flex h-8 shrink-0 items-center gap-4 border-t bg-muted/50 px-4 text-xs text-muted-foreground transition-colors duration-200"
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="h-5 rounded-sm text-[10px]">
          {milestone}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        <span>Cost:</span>
        <span className="font-mono">${cost.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span>Status:</span>
        <Badge
          variant={sessionState === "error" ? "destructive" : "secondary"}
          className="h-5 rounded-sm text-[10px]"
        >
          {stateLabel[sessionState] ?? sessionState}
        </Badge>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <NotificationPopover />
        <div className="flex items-center gap-1">
          <span>Project:</span>
          <span className="truncate max-w-[200px]">
            {activeProject?.name ?? "None"}
          </span>
        </div>
      </div>
    </footer>
  );
}
