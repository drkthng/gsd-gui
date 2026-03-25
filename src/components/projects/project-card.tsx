import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ProjectDisplayInfo } from "@/lib/types";

interface ProjectCardProps {
  project: ProjectDisplayInfo;
  onClick: (project: ProjectDisplayInfo) => void;
}

const statusConfig = {
  active: { label: "Active", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  paused: { label: "Paused", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  idle: { label: "Idle", className: "bg-muted text-muted-foreground" },
} as const;

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => onClick(project)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">{project.name}</CardTitle>
          <Badge variant="outline" className={`shrink-0 text-[10px] ${status.className}`}>
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{project.path}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {project.currentMilestone && (
            <Badge variant="secondary" className="text-[10px]">{project.currentMilestone}</Badge>
          )}
          <span className="font-mono">${project.totalCost.toFixed(2)}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
