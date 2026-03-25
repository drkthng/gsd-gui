import { useQuery } from "@tanstack/react-query";
import { createGsdClient } from "@/services/gsd-client";
import type { QuerySnapshot } from "@/lib/types";

const client = createGsdClient();

/**
 * Hook that polls GSD headless query state for a project.
 * Returns a TanStack Query result with auto-refresh every 2 seconds.
 * Disabled when projectPath is null/undefined.
 */
export function useGsdState(projectPath: string | null | undefined) {
  return useQuery<QuerySnapshot>({
    queryKey: ["gsd-state", projectPath],
    queryFn: () => client.queryState(projectPath!),
    enabled: !!projectPath,
    refetchInterval: 2000,
    staleTime: 1000,
  });
}
