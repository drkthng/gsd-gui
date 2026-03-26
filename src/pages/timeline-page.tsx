import { AlertCircle, FolderOpen, Map } from "lucide-react";
import { RoadmapView } from "@/components/dashboard/roadmap-view";
import { useMilestoneData } from "@/hooks/use-milestone-data";
import { useProjectStore } from "@/stores/project-store";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export function TimelinePage() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { milestones, isLoading, error } = useMilestoneData();

  const slices = milestones.flatMap((m) =>
    m.slices.map((s) => ({ ...s, id: `${m.id}/${s.id}` }))
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Map className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            View roadmap slices with risk and status.
          </p>
        </div>
      </div>
      {!activeProject ? (
        <EmptyState
          icon={FolderOpen}
          title="No project selected"
          description="Select a project from the gallery to view the timeline."
        />
      ) : isLoading ? (
        <LoadingState message="Loading timeline data…" />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load timeline"
          description={error}
        />
      ) : slices.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No slices"
          description="This project has no roadmap slices yet."
        />
      ) : (
        <RoadmapView slices={slices} />
      )}
    </div>
  );
}
