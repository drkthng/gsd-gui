import { Flag } from "lucide-react";
import { ProgressDashboard } from "@/components/dashboard/progress-dashboard";
import { mockMilestones } from "@/test/mock-data";

export function MilestonesPage() {
  // TODO: Replace with real data from headless query when available
  const milestones = mockMilestones;

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
      <ProgressDashboard milestones={milestones} />
    </div>
  );
}
