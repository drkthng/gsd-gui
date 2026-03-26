import { useState, useEffect, useCallback, useRef } from "react";
import { createGsdClient } from "@/services/gsd-client";
import { useProjectStore } from "@/stores/project-store";
import { deriveCostData } from "@/lib/derive-cost-data";
import type { MilestoneInfo, CostData } from "@/lib/types";

const client = createGsdClient();

interface UseMilestoneDataResult {
  milestones: MilestoneInfo[];
  costData: CostData;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const emptyCostData: CostData = {
  totalCost: 0,
  budgetCeiling: null,
  byPhase: [],
  byModel: [],
  bySlice: [],
};

/**
 * Hook that fetches parsed milestone data when the active project changes.
 *
 * Subscribes to `useProjectStore.activeProject`. When it changes to a
 * non-null value, calls `parseProjectMilestones` via the GSD client
 * and derives cost data from the result.
 *
 * Returns `{ milestones, costData, isLoading, error, refetch }`.
 */
export function useMilestoneData(): UseMilestoneDataResult {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [milestones, setMilestones] = useState<MilestoneInfo[]>([]);
  const [costData, setCostData] = useState<CostData>(emptyCostData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the fetch generation to discard stale responses
  const fetchGenRef = useRef(0);

  const fetchData = useCallback(
    async (projectPath: string) => {
      const gen = ++fetchGenRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const data = await client.parseProjectMilestones(projectPath);

        // Discard if a newer fetch has been initiated
        if (gen !== fetchGenRef.current) return;

        setMilestones(data);
        setCostData(deriveCostData(data));
      } catch (err) {
        if (gen !== fetchGenRef.current) return;

        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setMilestones([]);
        setCostData(emptyCostData);
      } finally {
        if (gen === fetchGenRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  // Fetch when activeProject changes
  useEffect(() => {
    if (!activeProject) {
      setMilestones([]);
      setCostData(emptyCostData);
      setError(null);
      setIsLoading(false);
      return;
    }

    fetchData(activeProject.path);
  }, [activeProject, fetchData]);

  const refetch = useCallback(() => {
    if (activeProject) {
      fetchData(activeProject.path);
    }
  }, [activeProject, fetchData]);

  return { milestones, costData, isLoading, error, refetch };
}
