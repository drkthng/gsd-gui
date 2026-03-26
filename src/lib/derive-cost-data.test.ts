import { describe, it, expect } from "vitest";
import { deriveCostData } from "./derive-cost-data";
import type { MilestoneInfo } from "@/lib/types";

function makeMilestone(
  overrides: Partial<MilestoneInfo> = {},
): MilestoneInfo {
  return {
    id: "M001",
    title: "Test Milestone",
    status: "in-progress",
    cost: 0,
    progress: 50,
    slices: [],
    ...overrides,
  };
}

describe("deriveCostData", () => {
  it("returns zeroed CostData for empty input", () => {
    const result = deriveCostData([]);
    expect(result).toEqual({
      totalCost: 0,
      budgetCeiling: null,
      byPhase: [],
      byModel: [],
      bySlice: [],
    });
  });

  it("budgetCeiling is always null", () => {
    const result = deriveCostData([makeMilestone()]);
    expect(result.budgetCeiling).toBeNull();
  });

  it("byModel is always an empty array", () => {
    const result = deriveCostData([makeMilestone()]);
    expect(result.byModel).toEqual([]);
  });

  it("sums costs for a single milestone with slices and tasks", () => {
    const milestone = makeMilestone({
      id: "M001",
      title: "Foundation",
      slices: [
        {
          id: "S01",
          title: "Setup",
          status: "done",
          risk: "low",
          cost: 0,
          progress: 100,
          tasks: [
            { id: "T01", title: "Init", status: "done", cost: 1.5, duration: "2h" },
            { id: "T02", title: "Config", status: "done", cost: 0.8, duration: "1h" },
          ],
          depends: [],
        },
        {
          id: "S02",
          title: "Core",
          status: "in-progress",
          risk: "medium",
          cost: 0,
          progress: 50,
          tasks: [
            { id: "T01", title: "Build", status: "done", cost: 2.0, duration: "3h" },
          ],
          depends: ["S01"],
        },
      ],
    });

    const result = deriveCostData([milestone]);

    expect(result.totalCost).toBeCloseTo(4.3);
    expect(result.byPhase).toEqual([
      { phase: "M001: Foundation", cost: 4.3 },
    ]);
    expect(result.bySlice).toEqual([
      { sliceId: "S01", title: "Setup", cost: 2.3 },
      { sliceId: "S02", title: "Core", cost: 2.0 },
    ]);
  });

  it("aggregates costs across multiple milestones", () => {
    const m1 = makeMilestone({
      id: "M001",
      title: "Phase 1",
      slices: [
        {
          id: "S01",
          title: "Slice A",
          status: "done",
          risk: "low",
          cost: 0,
          progress: 100,
          tasks: [
            { id: "T01", title: "Task A", status: "done", cost: 3.0, duration: null },
          ],
          depends: [],
        },
      ],
    });

    const m2 = makeMilestone({
      id: "M002",
      title: "Phase 2",
      slices: [
        {
          id: "S01",
          title: "Slice B",
          status: "pending",
          risk: "high",
          cost: 0,
          progress: 0,
          tasks: [
            { id: "T01", title: "Task B", status: "pending", cost: 5.0, duration: null },
            { id: "T02", title: "Task C", status: "pending", cost: 2.0, duration: null },
          ],
          depends: [],
        },
      ],
    });

    const result = deriveCostData([m1, m2]);

    expect(result.totalCost).toBeCloseTo(10.0);
    expect(result.byPhase).toHaveLength(2);
    expect(result.byPhase[0]).toEqual({ phase: "M001: Phase 1", cost: 3.0 });
    expect(result.byPhase[1]).toEqual({ phase: "M002: Phase 2", cost: 7.0 });
    expect(result.bySlice).toHaveLength(2);
  });

  it("falls back to slice.cost when all task costs are zero", () => {
    const milestone = makeMilestone({
      slices: [
        {
          id: "S01",
          title: "No-cost tasks",
          status: "done",
          risk: "low",
          cost: 5.0,
          progress: 100,
          tasks: [
            { id: "T01", title: "A", status: "done", cost: 0, duration: null },
            { id: "T02", title: "B", status: "done", cost: 0, duration: null },
          ],
          depends: [],
        },
      ],
    });

    const result = deriveCostData([milestone]);
    expect(result.totalCost).toBe(5.0);
    expect(result.bySlice[0].cost).toBe(5.0);
  });

  it("falls back to milestone.cost when all slice costs are zero", () => {
    const milestone = makeMilestone({
      id: "M001",
      title: "Legacy",
      cost: 12.0,
      slices: [],
    });

    const result = deriveCostData([milestone]);
    // No slices → milestoneCost stays 0, but milestone.cost is 12
    expect(result.totalCost).toBe(12.0);
    expect(result.byPhase[0].cost).toBe(12.0);
  });

  it("handles milestones with empty task arrays in slices", () => {
    const milestone = makeMilestone({
      slices: [
        {
          id: "S01",
          title: "Empty tasks",
          status: "pending",
          risk: "low",
          cost: 2.5,
          progress: 0,
          tasks: [],
          depends: [],
        },
      ],
    });

    const result = deriveCostData([milestone]);
    expect(result.totalCost).toBe(2.5);
    expect(result.bySlice[0].cost).toBe(2.5);
  });
});
