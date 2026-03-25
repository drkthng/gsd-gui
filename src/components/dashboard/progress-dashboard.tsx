import { useState } from "react";
import { ChevronRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Flag } from "lucide-react";
import type { MilestoneInfo, SliceInfo, TaskInfo, CompletionStatus } from "@/lib/types";

interface ProgressDashboardProps {
  milestones: MilestoneInfo[];
}

const statusIcon: Record<CompletionStatus, React.ReactNode> = {
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  "in-progress": <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  pending: <Circle className="h-4 w-4 text-muted-foreground" />,
  blocked: <Circle className="h-4 w-4 text-red-500" />,
};

export function ProgressDashboard({ milestones }: ProgressDashboardProps) {
  if (milestones.length === 0) {
    return <EmptyState icon={Flag} title="No milestones" description="No milestone data available." />;
  }

  return (
    <div className="space-y-2">
      {milestones.map((m) => (
        <MilestoneNode key={m.id} milestone={m} />
      ))}
    </div>
  );
}

function MilestoneNode({ milestone }: { milestone: MilestoneInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        {statusIcon[milestone.status]}
        <span className="text-sm font-medium flex-1">
          {milestone.id}: {milestone.title}
        </span>
        <span className="text-xs text-muted-foreground font-mono">${milestone.cost.toFixed(2)}</span>
        <Badge variant="outline" className="text-[10px]">{milestone.progress}%</Badge>
      </button>
      {expanded && (
        <div className="border-t px-3 pb-3">
          <div className="ml-7 mt-2 space-y-1">
            {milestone.slices.map((s) => (
              <SliceNode key={s.id} slice={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SliceNode({ slice }: { slice: SliceInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        {statusIcon[slice.status]}
        <span className="text-xs flex-1">{slice.id}: {slice.title}</span>
        <span className="text-[10px] text-muted-foreground font-mono">${slice.cost.toFixed(2)}</span>
      </button>
      {expanded && (
        <div className="ml-8 mt-1 space-y-0.5">
          {slice.tasks.map((t) => (
            <TaskNode key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskNode({ task }: { task: TaskInfo }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
      {statusIcon[task.status]}
      <span className="flex-1">{task.id}: {task.title}</span>
      {task.duration && <span className="text-[10px]">{task.duration}</span>}
      <span className="font-mono text-[10px]">${task.cost.toFixed(2)}</span>
    </div>
  );
}
