import { useState, useEffect, useCallback, useRef } from "react";
import { createGsdClient } from "@/services/gsd-client";
import { useProjectStore } from "@/stores/project-store";
import type { PreferencesData } from "@/lib/types";

const client = createGsdClient();

interface UsePreferencesResult {
  preferences: PreferencesData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  savePreferences: (data: PreferencesData) => Promise<void>;
  refetch: () => void;
}

/**
 * Hook that reads GSD preferences when the active project changes.
 *
 * Subscribes to `useProjectStore.activeProject`. When it changes to a
 * non-null value, calls `client.readPreferences(activeProject.path)` and
 * returns the parsed preferences object.
 *
 * Exposes `savePreferences(data)` which calls `client.writePreferences` and
 * then refreshes the local state from the persisted values.
 *
 * When no project is selected, returns null preferences with no loading state.
 *
 * Returns `{ preferences, isLoading, isSaving, error, savePreferences, refetch }`.
 */
export function usePreferences(): UsePreferencesResult {
  const activeProject = useProjectStore((s) => s.activeProject);
  const [preferences, setPreferences] = useState<PreferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the fetch generation to discard stale responses
  const fetchGenRef = useRef(0);

  const fetchData = useCallback(async (projectPath: string) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await client.readPreferences(projectPath);

      // Discard if a newer fetch has been initiated
      if (gen !== fetchGenRef.current) return;

      setPreferences(data);
    } catch (err) {
      if (gen !== fetchGenRef.current) return;

      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setPreferences(null);
    } finally {
      if (gen === fetchGenRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch when activeProject changes
  useEffect(() => {
    if (!activeProject) {
      setPreferences(null);
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

  const savePreferences = useCallback(
    async (data: PreferencesData) => {
      if (!activeProject) return;

      setIsSaving(true);
      setError(null);

      try {
        await client.writePreferences(activeProject.path, data);
        // Refresh local state from disk after successful save
        await fetchData(activeProject.path);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [activeProject, fetchData],
  );

  return { preferences, isLoading, isSaving, error, savePreferences, refetch };
}
