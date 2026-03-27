import { useState, useCallback } from "react";
import { createGsdClient } from "@/services/gsd-client";
import type { ProjectMetadata } from "@/lib/types";

const client = createGsdClient();

interface UseImportDetectionState {
  metadata: ProjectMetadata | null;
  error: string | null;
  isLoading: boolean;
}

interface UseImportDetectionResult extends UseImportDetectionState {
  detect: (path: string) => Promise<ProjectMetadata | null>;
  reset: () => void;
}

/**
 * Hook that wraps `client.detectProjectMetadata(path)`.
 *
 * Exposes:
 *   - `metadata`  — populated ProjectMetadata or null
 *   - `error`     — error string on failure, null otherwise
 *   - `isLoading` — true while the detection call is in flight
 *   - `detect(path)` — trigger detection for a given path
 *   - `reset()`   — clear state back to initial
 */
export function useImportDetection(): UseImportDetectionResult {
  const [metadata, setMetadata] = useState<ProjectMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detect = useCallback(async (path: string): Promise<ProjectMetadata | null> => {
    setIsLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const result = await client.detectProjectMetadata(path);
      setMetadata(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMetadata(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { metadata, error, isLoading, detect, reset };
}
