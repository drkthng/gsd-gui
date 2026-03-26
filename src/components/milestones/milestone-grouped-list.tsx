import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProgressDashboard } from "@/components/dashboard/progress-dashboard";
import type { StatusGroup } from "@/lib/milestone-filters";

interface MilestoneGroupedListProps {
  groups: StatusGroup[];
}

export function MilestoneGroupedList({ groups }: MilestoneGroupedListProps) {
  // Track expanded state per group label — all expanded by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (groups.length === 0) return null;

  const toggle = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isOpen = !collapsed[group.label];

        return (
          <Collapsible
            key={group.label}
            open={isOpen}
            onOpenChange={() => toggle(group.label)}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                <span>{group.label}</span>
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0 text-[10px] leading-4"
                >
                  {group.milestones.length}
                </Badge>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1 pl-2">
                <ProgressDashboard milestones={group.milestones} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
