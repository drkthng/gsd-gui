import { AlertCircle, DollarSign, FolderOpen } from "lucide-react";
import { CostOverview } from "@/components/dashboard/cost-overview";
import { useMilestoneData } from "@/hooks/use-milestone-data";
import { useProjectStore } from "@/stores/project-store";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

export function CostsPage() {
  const activeProject = useProjectStore((s) => s.activeProject);
  const { costData, isLoading, error } = useMilestoneData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Costs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor budget, cost breakdown, and spending trends.
          </p>
        </div>
      </div>
      {!activeProject ? (
        <EmptyState
          icon={FolderOpen}
          title="No project selected"
          description="Select a project from the gallery to view cost data."
        />
      ) : isLoading ? (
        <LoadingState message="Loading cost data…" />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Failed to load cost data"
          description={error}
        />
      ) : (
        <CostOverview data={costData} />
      )}
    </div>
  );
}
