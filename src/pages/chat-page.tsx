import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ChatView, ConnectionStatusBanner, RestartBanner } from "@/components/chat";
import { MessageInput } from "@/components/chat";
import { AutoModeControls } from "@/components/controls";
import { useGsdStore } from "@/stores/gsd-store";
import { useProjectStore } from "@/stores/project-store";

export function ChatPage() {
  const sessionState = useGsdStore((s) => s.sessionState);
  const connect = useGsdStore((s) => s.connect);
  const activeProject = useProjectStore((s) => s.activeProject);
  const showRestartBanner = useGsdStore((s) => s.showRestartBanner);
  const versionInfo = useGsdStore((s) => s.versionInfo);

  // Auto-connect when visiting the chat page with no active session.
  // Uses the active project's path, or a fallback for demo mode.
  useEffect(() => {
    if (sessionState === "idle") {
      const projectPath = activeProject?.path ?? "demo";
      connect(projectPath);
    }
  }, [sessionState, connect, activeProject]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" data-testid="page-icon" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chat</h1>
            <p className="text-sm text-muted-foreground">
              Interact with GSD agents and manage conversations.
            </p>
          </div>
        </div>
        <AutoModeControls />
      </div>
      {showRestartBanner && (
        <RestartBanner version={versionInfo?.latest} />
      )}
      <ConnectionStatusBanner />
      <ChatView />
      <MessageInput />
    </div>
  );
}
