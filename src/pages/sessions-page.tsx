import { AlertCircle, FolderOpen, History } from "lucide-react";
import { SessionBrowser } from "@/components/dashboard";
import { useSessions } from "@/hooks/use-sessions";
import { useProjectStore } from "@/stores/project-store";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export function SessionsPage() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { sessions, isLoading, error } = useSessions();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Browse session history with timestamps, message counts, and previews.
          </p>
        </div>
      </div>
      {!activeProject ? (
        <EmptyState
          icon={FolderOpen}
          title="No project selected"
          description="Select a project from the gallery to view session history."
        />
      ) : isLoading ? (
        <LoadingState message="Loading sessions…" />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load sessions"
          description={error}
        />
      ) : (
        <SessionBrowser sessions={sessions} />
      )}
    </div>
  );
}
