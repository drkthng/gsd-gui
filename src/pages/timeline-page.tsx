import { Map } from "lucide-react";
import { RoadmapView } from "@/components/dashboard/roadmap-view";
import { mockMilestones } from "@/test/mock-data";

export function TimelinePage() {
  // TODO: Replace with real data — show active milestone's slices
  const slices = mockMilestones.flatMap((m) =>
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
      <RoadmapView slices={slices} />
    </div>
  );
}
