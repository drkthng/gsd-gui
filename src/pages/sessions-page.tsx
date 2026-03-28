import { AlertCircle, FolderOpen, History, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SessionBrowser } from "@/components/dashboard";
import { useSessions } from "@/hooks/use-sessions";
import { useProjectStore } from "@/stores/project-store";
import { useGsdStore } from "@/stores/gsd-store";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SessionsPage() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const sessionState = useGsdStore((s) => s.sessionState);
  const activeProjectPath = useGsdStore((s) => s.activeProjectPath);
  const connect = useGsdStore((s) => s.connect);
  const { sessions, total, isLoading, isLoadingMore, error, hasMore, loadMore, loadAll } = useSessions();
  const navigate = useNavigate();

  const isLive =
    activeProject &&
    activeProjectPath === activeProject.path &&
    (sessionState === "connected" || sessionState === "streaming");

  const activeSessions = sessions.filter((s) => s.isActive);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" data-testid="page-icon" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
              {isLive && (
                <Badge className="bg-green-600 hover:bg-green-600 text-white gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  Live
                </Badge>
              )}
            </div>
            {activeProject ? (
              <div className="flex items-center gap-1 mt-0.5">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{activeProject.name}</span>
                  <span className="font-mono text-xs ml-2">{activeProject.path}</span>
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Browse session history for a project.</p>
            )}
          </div>
        </div>

        {activeProject && (
          <Button
            size="sm"
            variant={isLive ? "default" : "outline"}
            className="gap-2 shrink-0"
            onClick={() => {
              if (!isLive) void connect(activeProject.path);
              navigate("/chat");
            }}
          >
            <MessageSquare className="h-4 w-4" />
            {isLive ? "Resume Chat" : "Open Chat"}
          </Button>
        )}
      </div>

      {/* Active session callout */}
      {activeSessions.length > 0 && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="font-medium">{activeSessions.length} active session{activeSessions.length > 1 ? "s" : ""}</span>
            <span className="text-muted-foreground">currently running</span>
          </div>
          <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => navigate("/chat")}>
            <MessageSquare className="h-3 w-3" />
            Go to Chat
          </Button>
        </div>
      )}

      {/* Content */}
      {!activeProject ? (
        <EmptyState
          icon={FolderOpen}
          title="No project selected"
          description="Select a project from the gallery to view session history."
        />
      ) : isLoading ? (
        <LoadingState message="Loading sessions…" />
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Failed to load sessions" description={error} />
      ) : (
        <SessionBrowser
          sessions={sessions}
          total={total}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onLoadAll={loadAll}
        />
      )}
    </div>
  );
}
