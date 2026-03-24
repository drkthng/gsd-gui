import { Flag, CheckCircle2, Circle } from "lucide-react";

export function MilestonesPage() {
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

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Current Milestone
        </h2>
        <div className="rounded-md border bg-background p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">M001 — App Shell &amp; Foundation</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              In Progress
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Establish the desktop app shell with sidebar navigation, routing, and theme support.
          </p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>3 of 4 slices complete</span>
              <span>75%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-primary transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Upcoming Milestones
        </h2>
        <div className="space-y-2">
          {[
            { id: "M002", title: "Chat Interface", done: false },
            { id: "M003", title: "Project Management", done: false },
            { id: "M004", title: "Cost Tracking", done: false },
          ].map((ms) => (
            <div
              key={ms.id}
              className="flex items-center gap-3 rounded-md border bg-background px-3 py-2 transition-colors hover:bg-muted/50"
            >
              {ms.done ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground">{ms.id}</span>
              <span className="text-sm text-muted-foreground">{ms.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
