import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StatusFilter } from "@/lib/milestone-filters";
import { cn } from "@/lib/utils";

const filters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "complete", label: "Complete" },
  { value: "planned", label: "Planned" },
];

interface MilestoneFilterBarProps {
  counts: Record<StatusFilter, number>;
  activeFilter: StatusFilter;
  onChange: (filter: StatusFilter) => void;
}

export function MilestoneFilterBar({
  counts,
  activeFilter,
  onChange,
}: MilestoneFilterBarProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Filter milestones by status">
      {filters.map(({ value, label }) => {
        const isActive = activeFilter === value;
        return (
          <Button
            key={value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            data-active={isActive}
            onClick={() => onChange(value)}
            className={cn(
              "gap-1.5",
              !isActive && "text-muted-foreground",
            )}
          >
            {label}
            <Badge
              variant={isActive ? "secondary" : "outline"}
              className="ml-0.5 px-1.5 py-0 text-[10px] leading-4"
            >
              {counts[value]}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
