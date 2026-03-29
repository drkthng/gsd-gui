import { useState, useEffect, useCallback, useRef } from "react";
import { createGsdClient } from "@/services/gsd-client";
import type { QuerySnapshot, ActivityEntry } from "@/lib/types";

const client = createGsdClient();

export interface ProjectLiveData {
  currentMilestone: string | null;
  totalCost: number;
  lastActivity: string | null; // ISO timestamp of most recent ActivityEntry, or null
  isLoading: boolean;
  error: string | null;
}

const defaults: ProjectLiveData = {
  currentMilestone: null,
  totalCost: 0,
  lastActivity: null,
  isLoading: false,
  error: null,
};

/**
 * Hook that fetches live project data for a given project path.
 *
 * Accepts `projectPath: string | null`. When null, returns default zero/null
 * values immediately with no loading state and no network calls.
 *
 * When a path is provided, calls `queryState` and `listActivity` in parallel
 * via `Promise.all`, then derives:
 *   - `currentMilestone` from the QuerySnapshot
 *   - `totalCost` from the QuerySnapshot
 *   - `lastActivity` as the ISO timestamp of the most recent ActivityEntry
 *     (sorted descending by timestamp string, first item taken)
 *
 * Uses a fetch-generation ref to discard stale responses when the path changes
 * before a pending fetch completes.
 *
 * Returns `{ currentMilestone, totalCost, lastActivity, isLoading, error }`.
 */
export function useProjectLiveData(projectPath: string | null): ProjectLiveData {
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the fetch generation to discard stale responses on rapid path changes
  const fetchGenRef = useRef(0);

  const fetchData = useCallback(async (path: string) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const [snapshot, activity]: [QuerySnapshot, ActivityEntry[]] = await Promise.all([
        client.queryState(path),
        client.listActivity(path),
      ]);

      // Discard if a newer fetch has been initiated
      if (gen !== fetchGenRef.current) return;

      // Derive lastActivity: sort by ISO timestamp string descending, take first
      const sorted = [...activity].sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp),
      );
      const mostRecent = sorted[0]?.timestamp ?? null;

      setCurrentMilestone(snapshot.currentMilestone);
      setTotalCost(snapshot.totalCost);
      setLastActivity(mostRecent);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;

      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setCurrentMilestone(null);
      setTotalCost(0);
      setLastActivity(null);
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!projectPath) {
      // Reset to defaults — no loading, no side-effects
      setCurrentMilestone(null);
      setTotalCost(0);
      setLastActivity(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    fetchData(projectPath);
  }, [projectPath, fetchData]);

  return { currentMilestone, totalCost, lastActivity, isLoading, error };
}
