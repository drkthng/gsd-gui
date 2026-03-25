import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { Map } from "lucide-react";
import type { SliceInfo, RiskLevel, CompletionStatus } from "@/lib/types";

interface RoadmapViewProps {
  slices: SliceInfo[];
}

const riskColors: Record<RiskLevel, string> = {
  low: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusColors: Record<CompletionStatus, string> = {
  done: "bg-green-500/10 text-green-600 dark:text-green-400",
  "in-progress": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  pending: "bg-muted text-muted-foreground",
  blocked: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function RoadmapView({ slices }: RoadmapViewProps) {
  if (slices.length === 0) {
    return <EmptyState icon={Map} title="No slices" description="No roadmap data available." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slices.map((slice) => (
        <Card key={slice.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium">{slice.title}</CardTitle>
              <Badge variant="outline" className="text-[10px]">{slice.id}</Badge>
            </div>
            <div className="flex gap-1.5">
              <Badge variant="outline" className={`text-[10px] ${riskColors[slice.risk]}`}>
                {slice.risk}
              </Badge>
              <Badge variant="outline" className={`text-[10px] ${statusColors[slice.status]}`}>
                {slice.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{slice.tasks.length} tasks</span>
              <span>{slice.progress}%</span>
            </div>
            <Progress value={slice.progress} className="h-1.5" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">${slice.cost.toFixed(2)}</span>
              {slice.depends.length > 0 && (
                <span>depends: {slice.depends.join(", ")}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
