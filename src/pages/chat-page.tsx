import { useEffect } from "react";
import { MessageSquare, FolderOpen, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatView, ConnectionStatusBanner, RestartBanner } from "@/components/chat";
import { MessageInput } from "@/components/chat";
import { AutoModeControls } from "@/components/controls";
import { useGsdStore } from "@/stores/gsd-store";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ChatPage() {
  const sessionState = useGsdStore((s) => s.sessionState);
  const connect = useGsdStore((s) => s.connect);
  const activeProjectPath = useGsdStore((s) => s.activeProjectPath);
  const activeProject = useProjectStore((s) => s.activeProject);
  const showRestartBanner = useGsdStore((s) => s.showRestartBanner);
  const versionInfo = useGsdStore((s) => s.versionInfo);
  const navigate = useNavigate();

  // Auto-connect when visiting the chat page with no active session.
  // Uses the active project's path, or a fallback for demo mode.
  useEffect(() => {
    if (sessionState === "idle") {
      const projectPath = activeProject?.path ?? "demo";
      connect(projectPath);
    }
  }, [sessionState, connect, activeProject]);

  // The path shown in the header: prefer the live session path,
  // fall back to the selected project path.
  const displayPath = activeProjectPath ?? activeProject?.path ?? null;
  const displayName = activeProject?.name ?? (displayPath ? displayPath.split(/[\\/]/).pop() : null);

  const sessionBadge = (() => {
    switch (sessionState) {
      case "connected": return { label: "Connected", className: "bg-green-600 hover:bg-green-600 text-white" };
      case "streaming": return { label: "Running", className: "bg-blue-600 hover:bg-blue-600 text-white" };
      case "connecting": return { label: "Connecting…", className: "bg-yellow-600 hover:bg-yellow-600 text-white" };
      case "disconnected": return { label: "Disconnected", className: "" };
      case "error": return { label: "Error", className: "bg-destructive text-destructive-foreground" };
      default: return null;
    }
  })();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <MessageSquare className="h-5 w-5 shrink-0 text-primary" data-testid="page-icon" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold tracking-tight leading-tight">Chat</h1>
              {sessionBadge && (
                <Badge className={`h-5 px-1.5 text-[10px] ${sessionBadge.className}`}>
                  {sessionState === "streaming" && (
                    <span className="relative flex h-1.5 w-1.5 mr-1">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  )}
                  {sessionBadge.label}
                </Badge>
              )}
            </div>
            {displayPath ? (
              <div className="flex items-center gap-1 mt-0.5">
                <FolderOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[400px]" title={displayPath}>
                  {displayName && (
                    <span className="font-medium text-foreground">{displayName}</span>
                  )}
                  {displayName && displayPath !== displayName && (
                    <span className="text-muted-foreground"> · {displayPath}</span>
                  )}
                  {!displayName && displayPath}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground">No project selected — </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => navigate("/projects")}
                >
                  <FolderKanban className="h-3 w-3 mr-1" />
                  Pick a project
                </Button>
              </div>
            )}
          </div>
        </div>
        <AutoModeControls />
      </div>

      {showRestartBanner && <RestartBanner version={versionInfo?.latest} />}
      <ConnectionStatusBanner />
      <ChatView />
      <MessageInput />
    </div>
  );
}
