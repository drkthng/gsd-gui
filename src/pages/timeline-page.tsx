import { Clock, Activity, Calendar } from "lucide-react";

export function TimelinePage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted-foreground">
            Visualize project timelines and schedules.
          </p>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Sprint Timeline</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Mar 18 – Mar 31, 2026</span>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            { day: "Mon", items: 3, filled: true },
            { day: "Tue", items: 5, filled: true },
            { day: "Wed", items: 2, filled: true },
            { day: "Thu", items: 4, filled: false },
            { day: "Fri", items: 1, filled: false },
          ].map((d) => (
            <div key={d.day} className="flex items-center gap-3">
              <span className="w-8 text-xs font-medium text-muted-foreground">{d.day}</span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    d.filled ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                  style={{ width: `${d.items * 20}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs text-muted-foreground">
                {d.items} tasks
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[
            { action: "Completed S03 slice", time: "10 min ago" },
            { action: "Started T02 task", time: "25 min ago" },
            { action: "Merged PR #14", time: "1 hour ago" },
            { action: "Updated milestone M001", time: "2 hours ago" },
          ].map((event) => (
            <div
              key={event.action}
              className="flex items-center gap-3 text-sm"
            >
              <Activity className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-foreground">{event.action}</span>
              <span className="text-xs text-muted-foreground">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
