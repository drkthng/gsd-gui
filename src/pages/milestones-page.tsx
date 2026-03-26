import { useState } from "react";
import { AlertCircle, Flag, FolderOpen } from "lucide-react";
import { MilestoneGroupedList } from "@/components/milestones/milestone-grouped-list";
import { MilestoneFilterBar } from "@/components/milestones/milestone-filter-bar";
import {
  filterMilestonesByStatus,
  groupMilestonesByStatus,
  getStatusCounts,
  type StatusFilter,
} from "@/lib/milestone-filters";
import { useMilestoneData } from "@/hooks/use-milestone-data";
import { useProjectStore } from "@/stores/project-store";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export function MilestonesPage() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { milestones, isLoading, error } = useMilestoneData();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = filterMilestonesByStatus(milestones, filter);
  const groups = groupMilestonesByStatus(filtered);
  const counts = getStatusCounts(milestones);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Flag className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Milestones</h1>
          <p className="text-sm text-muted-foreground">
            Track milestone progress and deliverables.
          </p>
        </div>
      </div>
      {!activeProject ? (
        <EmptyState
          icon={FolderOpen}
          title="No project selected"
          description="Select a project from the gallery to view milestones."
        />
      ) : isLoading ? (
        <LoadingState message="Loading milestone data…" />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load milestones"
          description={error}
        />
      ) : milestones.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="No milestones"
          description="This project has no milestones yet."
        />
      ) : (
        <>
          <MilestoneFilterBar
            counts={counts}
            activeFilter={filter}
            onChange={setFilter}
          />
          <MilestoneGroupedList groups={groups} />
        </>
      )}
    </div>
  );
}
