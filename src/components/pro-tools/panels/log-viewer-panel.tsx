import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";
import { useActivity } from "@/hooks/use-activity";
import type { ActivityEntry } from "@/lib/types";

function formatSource(entry: ActivityEntry): string {
  let source = entry.milestoneId;
  if (entry.sliceId) source += `/${entry.sliceId}`;
  if (entry.taskId) source += `/${entry.taskId}`;
  return source;
}

export function LogViewerPanel() {
  const { activity, isLoading, error, refetch } = useActivity();

  const status = isLoading
    ? "loading"
    : error
      ? "error"
      : activity.length === 0
        ? "empty"
        : "ready";

  return (
    <ProToolPanel
      title="Log Viewer"
      status={status}
      errorMessage={error ?? undefined}
      onRetry={error ? refetch : undefined}
    >
      <div className="grid gap-3">
        {activity.map((entry) => (
          <Card key={entry.id} data-testid={`log-${entry.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-mono">
                {entry.action}
              </CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="mt-1 text-xs text-muted-foreground">
                {formatSource(entry)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
