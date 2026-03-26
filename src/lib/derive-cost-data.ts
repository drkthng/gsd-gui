import type { MilestoneInfo, CostData } from "@/lib/types";

/**
 * Derive cost data from parsed milestone tree.
 *
 * Sums costs across the milestone → slice → task tree.
 * Currently the parser returns cost=0 for all nodes (cost data isn't
 * in .gsd files yet), but this function will produce real numbers
 * once the parser populates costs.
 *
 * - `byPhase` maps each milestone as a "phase"
 * - `byModel` is always empty (no model attribution data available)
 * - `bySlice` lists every slice across all milestones with its cost
 * - `budgetCeiling` is always null (no budget data available)
 */
export function deriveCostData(milestones: MilestoneInfo[]): CostData {
  let totalCost = 0;
  const byPhase: CostData["byPhase"] = [];
  const bySlice: CostData["bySlice"] = [];

  for (const milestone of milestones) {
    let milestoneCost = 0;

    for (const slice of milestone.slices) {
      const sliceCost = slice.tasks.reduce(
        (sum, task) => sum + task.cost,
        0,
      );
      // Use task-level sum if available, fall back to slice.cost
      const effectiveSliceCost = sliceCost > 0 ? sliceCost : slice.cost;

      bySlice.push({
        sliceId: slice.id,
        title: slice.title,
        cost: effectiveSliceCost,
      });

      milestoneCost += effectiveSliceCost;
    }

    // Use computed sum if available, fall back to milestone.cost
    const effectiveMilestoneCost =
      milestoneCost > 0 ? milestoneCost : milestone.cost;

    byPhase.push({
      phase: `${milestone.id}: ${milestone.title}`,
      cost: effectiveMilestoneCost,
    });

    totalCost += effectiveMilestoneCost;
  }

  return {
    totalCost,
    budgetCeiling: null,
    byPhase,
    byModel: [],
    bySlice,
  };
}
