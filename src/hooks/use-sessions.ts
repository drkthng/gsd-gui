import { useState, useEffect, useCallback, useRef } from "react";
import { createGsdClient } from "@/services/gsd-client";
import { useProjectStore } from "@/stores/project-store";
import type { SessionInfo } from "@/lib/types";

const client = createGsdClient();

interface UseSessionsResult {
  sessions: SessionInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook that fetches session history when the active project changes.
 *
 * Subscribes to `useProjectStore.activeProject`. When it changes to a
 * non-null value, calls `client.listSessions(activeProject.path)` and
 * returns the parsed session list.
 *
 * When no project is selected, returns an empty sessions array with no
 * loading state.
 *
 * Returns `{ sessions, isLoading, error, refetch }`.
 */
export function useSessions(): UseSessionsResult {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the fetch generation to discard stale responses
  const fetchGenRef = useRef(0);

  const fetchData = useCallback(async (projectPath: string) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await client.listSessions(projectPath);

      // Discard if a newer fetch has been initiated
      if (gen !== fetchGenRef.current) return;

      setSessions(data);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;

      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setSessions([]);
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when activeProject changes
  useEffect(() => {
    if (!activeProject) {
      setSessions([]);
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

  return { sessions, isLoading, error, refetch };
}
