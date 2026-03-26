import { useState, useEffect, useCallback, useRef } from "react";
import { createGsdClient } from "@/services/gsd-client";
import { useProjectStore } from "@/stores/project-store";
import type { ActivityEntry } from "@/lib/types";

const client = createGsdClient();

interface UseActivityResult {
  activity: ActivityEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that fetches activity entries when the active project changes.
 *
 * Subscribes to `useProjectStore.activeProject`. When it changes to a
 * non-null value, calls `client.listActivity(activeProject.path)` and
 * returns the parsed activity list.
 *
 * When no project is selected, returns an empty activity array with no
 * loading state.
 *
 * Returns `{ activity, isLoading, error, refetch }`.
 */
export function useActivity(): UseActivityResult {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the fetch generation to discard stale responses
  const fetchGenRef = useRef(0);

  const fetchData = useCallback(async (projectPath: string) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await client.listActivity(projectPath);

      // Discard if a newer fetch has been initiated
      if (gen !== fetchGenRef.current) return;

      setActivity(data);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;

      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setActivity([]);
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when activeProject changes
  useEffect(() => {
    if (!activeProject) {
      setActivity([]);
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

  return { activity, isLoading, error, refetch };
}
