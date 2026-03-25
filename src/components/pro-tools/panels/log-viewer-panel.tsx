import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  source: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: "l1", timestamp: "12:04:32.001", level: "info", message: "Agent worker-1 started task", source: "orchestrator" },
  { id: "l2", timestamp: "12:04:32.045", level: "info", message: "Loading model weights", source: "worker-1" },
  { id: "l3", timestamp: "12:04:33.120", level: "warn", message: "Memory usage above 80%", source: "monitor" },
  { id: "l4", timestamp: "12:04:33.500", level: "error", message: "Connection timeout to upstream API", source: "worker-2" },
  { id: "l5", timestamp: "12:04:34.010", level: "info", message: "Retrying request (attempt 2/3)", source: "worker-2" },
];

const LEVEL_VARIANT: Record<LogEntry["level"], "default" | "secondary" | "destructive"> = {
  info: "secondary",
  warn: "default",
  error: "destructive",
};

export function LogViewerPanel() {
  return (
    <ProToolPanel title="Log Viewer" status="ready">
      <div className="grid gap-3">
        {MOCK_LOGS.map((entry) => (
          <Card key={entry.id} data-testid={`log-${entry.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-mono">{entry.timestamp}</CardTitle>
              <Badge variant={LEVEL_VARIANT[entry.level]}>{entry.level}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">{entry.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{entry.source}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
