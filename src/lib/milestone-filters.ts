import type { MilestoneInfo, CompletionStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Filter value for the milestone filter bar. */
export type StatusFilter = "all" | "active" | "complete" | "planned";

/** A group of milestones sharing the same status category. */
export interface StatusGroup {
  label: string;
  status: CompletionStatus[];
  milestones: MilestoneInfo[];
}

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

interface CategoryDef {
  label: string;
  status: CompletionStatus[];
}

const categories: CategoryDef[] = [
  { label: "Active", status: ["in-progress"] },
  { label: "Complete", status: ["done"] },
  { label: "Planned", status: ["pending", "blocked"] },
];

const filterToStatuses: Record<StatusFilter, CompletionStatus[] | null> = {
  all: null,
  active: ["in-progress"],
  complete: ["done"],
  planned: ["pending", "blocked"],
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Group milestones by status category: Active (in-progress), Complete (done),
 * and Planned (pending + blocked). Returns only non-empty groups in a stable
 * order: Active → Complete → Planned.
 */
export function groupMilestonesByStatus(
  milestones: MilestoneInfo[],
): StatusGroup[] {
  if (milestones.length === 0) return [];

  const groups: StatusGroup[] = [];

  for (const cat of categories) {
    const matched = milestones.filter((m) => cat.status.includes(m.status));
    if (matched.length > 0) {
      groups.push({
        label: cat.label,
        status: cat.status,
        milestones: matched,
      });
    }
  }

  return groups;
}

/**
 * Filter milestones by status category. Returns all milestones for 'all',
 * or the subset matching the given filter.
 */
export function filterMilestonesByStatus(
  milestones: MilestoneInfo[],
  filter: StatusFilter,
): MilestoneInfo[] {
  const statuses = filterToStatuses[filter];
  if (statuses === null) return milestones;
  return milestones.filter((m) => statuses.includes(m.status));
}

/**
 * Count milestones per filter category for badge display.
 */
export function getStatusCounts(
  milestones: MilestoneInfo[],
): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = {
    all: milestones.length,
    active: 0,
    complete: 0,
    planned: 0,
  };

  for (const m of milestones) {
    switch (m.status) {
      case "in-progress":
        counts.active++;
        break;
      case "done":
        counts.complete++;
        break;
      case "pending":
      case "blocked":
        counts.planned++;
        break;
    }
  }

  return counts;
}
