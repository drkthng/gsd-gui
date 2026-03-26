import { describe, it, expect } from "vitest";
import type { MilestoneInfo } from "@/lib/types";
import {
  groupMilestonesByStatus,
  filterMilestonesByStatus,
  getStatusCounts,
  type StatusFilter,
} from "@/lib/milestone-filters";

// ---------------------------------------------------------------------------
// Test fixtures — milestones covering all CompletionStatus values
// ---------------------------------------------------------------------------

const milestones: MilestoneInfo[] = [
  {
    id: "M001",
    title: "Scaffolding",
    status: "done",
    cost: 2.4,
    progress: 100,
    slices: [],
  },
  {
    id: "M002",
    title: "Backend Bridge",
    status: "in-progress",
    cost: 3.1,
    progress: 50,
    slices: [],
  },
  {
    id: "M003",
    title: "Dashboard",
    status: "pending",
    cost: 0,
    progress: 0,
    slices: [],
  },
  {
    id: "M004",
    title: "Analytics",
    status: "blocked",
    cost: 0,
    progress: 0,
    slices: [],
  },
  {
    id: "M005",
    title: "Polish",
    status: "done",
    cost: 1.2,
    progress: 100,
    slices: [],
  },
];

// ---------------------------------------------------------------------------
// groupMilestonesByStatus
// ---------------------------------------------------------------------------

describe("groupMilestonesByStatus", () => {
  it("returns empty array for empty input", () => {
    expect(groupMilestonesByStatus([])).toEqual([]);
  });

  it("returns one group when all milestones share a status category", () => {
    const doneMilestones = milestones.filter((m) => m.status === "done");
    const groups = groupMilestonesByStatus(doneMilestones);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Complete");
    expect(groups[0].milestones).toHaveLength(2);
  });

  it("groups mixed statuses into Active, Complete, and Planned", () => {
    const groups = groupMilestonesByStatus(milestones);
    const labels = groups.map((g) => g.label);
    expect(labels).toContain("Active");
    expect(labels).toContain("Complete");
    expect(labels).toContain("Planned");
  });

  it("puts in-progress milestones in the Active group", () => {
    const groups = groupMilestonesByStatus(milestones);
    const active = groups.find((g) => g.label === "Active")!;
    expect(active.milestones.map((m) => m.id)).toEqual(["M002"]);
  });

  it("puts done milestones in the Complete group", () => {
    const groups = groupMilestonesByStatus(milestones);
    const complete = groups.find((g) => g.label === "Complete")!;
    expect(complete.milestones.map((m) => m.id)).toEqual(["M001", "M005"]);
  });

  it("groups blocked milestones with planned (pending) in the Planned group", () => {
    const groups = groupMilestonesByStatus(milestones);
    const planned = groups.find((g) => g.label === "Planned")!;
    expect(planned.milestones.map((m) => m.id)).toEqual(["M003", "M004"]);
  });

  it("omits groups with no milestones", () => {
    const onlyDone = milestones.filter((m) => m.status === "done");
    const groups = groupMilestonesByStatus(onlyDone);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Complete");
  });

  it("each group includes the matching CompletionStatus values", () => {
    const groups = groupMilestonesByStatus(milestones);
    const active = groups.find((g) => g.label === "Active")!;
    expect(active.status).toEqual(["in-progress"]);
    const planned = groups.find((g) => g.label === "Planned")!;
    expect(planned.status).toEqual(["pending", "blocked"]);
  });
});

// ---------------------------------------------------------------------------
// filterMilestonesByStatus
// ---------------------------------------------------------------------------

describe("filterMilestonesByStatus", () => {
  it("returns all milestones for 'all' filter", () => {
    const result = filterMilestonesByStatus(milestones, "all");
    expect(result).toHaveLength(5);
  });

  it("returns only in-progress milestones for 'active' filter", () => {
    const result = filterMilestonesByStatus(milestones, "active");
    expect(result.map((m) => m.id)).toEqual(["M002"]);
  });

  it("returns only done milestones for 'complete' filter", () => {
    const result = filterMilestonesByStatus(milestones, "complete");
    expect(result.map((m) => m.id)).toEqual(["M001", "M005"]);
  });

  it("returns pending and blocked milestones for 'planned' filter", () => {
    const result = filterMilestonesByStatus(milestones, "planned");
    expect(result.map((m) => m.id)).toEqual(["M003", "M004"]);
  });

  it("returns empty array when no milestones match the filter", () => {
    const onlyDone = milestones.filter((m) => m.status === "done");
    const result = filterMilestonesByStatus(onlyDone, "active");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getStatusCounts
// ---------------------------------------------------------------------------

describe("getStatusCounts", () => {
  it("returns correct counts for each category", () => {
    const counts = getStatusCounts(milestones);
    expect(counts).toEqual({
      all: 5,
      active: 1,
      complete: 2,
      planned: 2,
    });
  });

  it("returns all zeros for empty input", () => {
    const counts = getStatusCounts([]);
    expect(counts).toEqual({ all: 0, active: 0, complete: 0, planned: 0 });
  });

  it("counts only the present statuses", () => {
    const onlyDone = milestones.filter((m) => m.status === "done");
    const counts = getStatusCounts(onlyDone);
    expect(counts).toEqual({ all: 2, active: 0, complete: 2, planned: 0 });
  });
});
