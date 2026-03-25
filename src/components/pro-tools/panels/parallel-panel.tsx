import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface ParallelSession {
  id: string;
  agent: string;
  task: string;
  status: "running" | "queued" | "completed" | "failed";
  elapsed?: string;
}

const MOCK_SESSIONS: ParallelSession[] = [
  { id: "s1", agent: "worker-1", task: "Implement auth middleware", status: "running", elapsed: "2m 14s" },
  { id: "s2", agent: "worker-2", task: "Write unit tests for API", status: "running", elapsed: "1m 03s" },
  { id: "s3", agent: "worker-3", task: "Refactor database layer", status: "queued" },
  { id: "s4", agent: "worker-4", task: "Update documentation", status: "completed", elapsed: "4m 32s" },
  { id: "s5", agent: "worker-5", task: "Fix CSS regression", status: "failed", elapsed: "0m 45s" },
];

const STATUS_VARIANT: Record<ParallelSession["status"], "default" | "secondary" | "destructive" | "outline"> = {
  running: "default",
  queued: "secondary",
  completed: "outline",
  failed: "destructive",
};

export function ParallelPanel() {
  const running = MOCK_SESSIONS.filter((s) => s.status === "running").length;
  const queued = MOCK_SESSIONS.filter((s) => s.status === "queued").length;

  return (
    <ProToolPanel title="Parallel Orchestration" status="ready">
      <div className="mb-4 flex gap-4 text-sm text-muted-foreground">
        <span data-testid="running-count">{running} running</span>
        <span data-testid="queued-count">{queued} queued</span>
      </div>

      <div className="grid gap-3">
        {MOCK_SESSIONS.map((session) => (
          <Card key={session.id} data-testid={`session-${session.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{session.agent}</CardTitle>
              <Badge variant={STATUS_VARIANT[session.status]}>{session.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{session.task}</p>
              {session.elapsed && (
                <p className="mt-1 text-xs text-muted-foreground">{session.elapsed}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
