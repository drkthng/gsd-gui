import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface DebugSession {
  id: string;
  agent: string;
  status: "paused" | "running" | "stopped";
  currentStep: string;
}

const MOCK_SESSIONS: DebugSession[] = [
  { id: "d1", agent: "planner-1", status: "paused", currentStep: "Evaluating tool selection" },
  { id: "d2", agent: "worker-1", status: "running", currentStep: "Executing file write" },
  { id: "d3", agent: "reviewer-1", status: "stopped", currentStep: "Code review complete" },
  { id: "d4", agent: "worker-2", status: "paused", currentStep: "Awaiting user confirmation" },
];

const STATUS_VARIANT: Record<DebugSession["status"], "default" | "secondary" | "destructive"> = {
  paused: "default",
  running: "secondary",
  stopped: "destructive",
};

export function DebuggerPanel() {
  return (
    <ProToolPanel title="Debugger" status="ready">
      <div className="grid gap-3">
        {MOCK_SESSIONS.map((session) => (
          <Card key={session.id} data-testid={`debug-${session.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{session.agent}</CardTitle>
              <Badge variant={STATUS_VARIANT[session.status]}>{session.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{session.currentStep}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
