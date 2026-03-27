import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { Map as MapIcon } from "lucide-react";
import type { SliceInfo, RiskLevel, CompletionStatus } from "@/lib/types";

interface RoadmapViewProps {
  slices: SliceInfo[];
}

interface ArrowPath {
  from: string;
  to: string;
  d: string;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [paths, setPaths] = useState<ArrowPath[]>([]);

  const hasDependencies = slices.some((s) => s.depends.length > 0);

  const recalcPaths = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPaths: ArrowPath[] = [];

    for (const slice of slices) {
      if (!slice.depends.length) continue;
      const targetEl = cardRefs.current.get(slice.id);
      if (!targetEl) continue;
      const targetRect = targetEl.getBoundingClientRect();

      for (const depId of slice.depends) {
        const sourceEl = cardRefs.current.get(depId);
        if (!sourceEl) continue;
        const sourceRect = sourceEl.getBoundingClientRect();

        const startX = sourceRect.right - containerRect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
        const endX = targetRect.left - containerRect.left;
        const endY = targetRect.top + targetRect.height / 2 - containerRect.top;
        const d = `M ${startX},${startY} C ${startX + 60},${startY} ${endX - 60},${endY} ${endX},${endY}`;

        newPaths.push({ from: depId, to: slice.id, d });
      }
    }

    setPaths(newPaths);
  }, [slices]);

  // Capture initial positions before first paint
  useLayoutEffect(() => {
    if (hasDependencies) recalcPaths();
  }, [recalcPaths, hasDependencies]);

  // Set up ResizeObserver for reflow on resize
  useEffect(() => {
    if (!hasDependencies || !containerRef.current) return;
    const observer = new ResizeObserver(() => recalcPaths());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [recalcPaths, hasDependencies]);

  if (slices.length === 0) {
    return <EmptyState icon={MapIcon} title="No slices" description="No roadmap data available." />;
  }

  return (
    <div className="relative" ref={containerRef}>
      {hasDependencies && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          {paths.map((p) => (
            <path
              key={`${p.from}-${p.to}`}
              d={p.d}
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="text-muted-foreground/40"
              data-from={p.from}
              data-to={p.to}
            />
          ))}
        </svg>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slices.map((slice) => (
          <Card
            key={slice.id}
            ref={(el) => {
              if (el) cardRefs.current.set(slice.id, el);
              else cardRefs.current.delete(slice.id);
            }}
          >
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
