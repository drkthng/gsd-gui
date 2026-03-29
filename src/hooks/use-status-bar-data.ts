import { useQuery } from "@tanstack/react-query";
import { createGsdClient } from "@/services/gsd-client";
import type { PreferencesData, ActivityEntry } from "@/lib/types";

const client = createGsdClient();

export interface StatusBarData {
  modelName: string;
  breadcrumb: string;
}

/**
 * Fetches preferences and activity in parallel for a given project path.
 *
 * Derives:
 *   - `modelName`: the `models.execution` field from preferences, or '—' when
 *     no project path is provided or the field is absent.
 *   - `breadcrumb`: M###[/S##[/T##]] built from the latest activity entry
 *     (sorted descending by ISO timestamp, lexicographic — D020 pattern), or
 *     '—' when no activity exists or no project path is provided.
 *
 * Both queries are disabled when `projectPath` is null, returning the dash
 * defaults immediately. Each query refreshes every 5 seconds.
 */
export function useStatusBarData(projectPath: string | null): StatusBarData {
  const enabled = !!projectPath;

  const { data: prefs } = useQuery<PreferencesData>({
    queryKey: ["preferences", projectPath],
    queryFn: () => client.readPreferences(projectPath!),
    enabled,
    refetchInterval: 5000,
    staleTime: 4000,
  });

  const { data: activity } = useQuery<ActivityEntry[]>({
    queryKey: ["activity", projectPath],
    queryFn: () => client.listActivity(projectPath!),
    enabled,
    refetchInterval: 5000,
    staleTime: 4000,
  });

  // Extract execution model from preferences (models is an arbitrary key)
  const modelName =
    enabled
      ? (prefs?.models as Record<string, string> | undefined)?.execution ?? "—"
      : "—";

  // Derive breadcrumb from the most-recent activity entry
  let breadcrumb = "—";
  if (enabled && activity && activity.length > 0) {
    // Sort descending by ISO timestamp (lexicographic comparison is correct for ISO 8601)
    const sorted = [...activity].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const latest = sorted[0];
    let crumb = latest.milestoneId;
    if (latest.sliceId) crumb += `/${latest.sliceId}`;
    if (latest.taskId) crumb += `/${latest.taskId}`;
    breadcrumb = crumb;
  }

  return { modelName, breadcrumb };
}
