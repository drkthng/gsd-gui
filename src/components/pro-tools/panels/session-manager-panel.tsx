import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface Session {
  id: string;
  name: string;
  status: "active" | "idle" | "terminated";
  startedAt: string;
}

const MOCK_SESSIONS: Session[] = [
  { id: "s1", name: "planner-main", status: "active", startedAt: "2026-03-25T10:00:00Z" },
  { id: "s2", name: "worker-build", status: "idle", startedAt: "2026-03-25T09:30:00Z" },
  { id: "s3", name: "reviewer-qa", status: "terminated", startedAt: "2026-03-25T08:15:00Z" },
  { id: "s4", name: "scout-research", status: "active", startedAt: "2026-03-25T11:00:00Z" },
];

const STATUS_VARIANT: Record<Session["status"], "default" | "secondary" | "destructive"> = {
  active: "default",
  idle: "secondary",
  terminated: "destructive",
};

export function SessionManagerPanel() {
  return (
    <ProToolPanel title="Session Manager" status="ready">
      <div className="grid gap-3">
        {MOCK_SESSIONS.map((session) => (
          <Card key={session.id} data-testid={`session-${session.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{session.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[session.status]}>{session.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Started: {session.startedAt}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
