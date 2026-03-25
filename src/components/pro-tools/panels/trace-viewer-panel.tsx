import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface Trace {
  id: string;
  operation: string;
  duration: string;
  status: "ok" | "error" | "timeout";
  spanCount: number;
}

const MOCK_TRACES: Trace[] = [
  { id: "t1", operation: "agent.plan", duration: "1.2s", status: "ok", spanCount: 8 },
  { id: "t2", operation: "tool.execute", duration: "3.4s", status: "ok", spanCount: 12 },
  { id: "t3", operation: "llm.completion", duration: "15.1s", status: "timeout", spanCount: 3 },
  { id: "t4", operation: "agent.review", duration: "2.0s", status: "error", spanCount: 5 },
  { id: "t5", operation: "tool.file-write", duration: "0.3s", status: "ok", spanCount: 2 },
];

const STATUS_VARIANT: Record<Trace["status"], "default" | "outline" | "destructive"> = {
  ok: "outline",
  error: "destructive",
  timeout: "default",
};

export function TraceViewerPanel() {
  return (
    <ProToolPanel title="Trace Viewer" status="ready">
      <div className="grid gap-3">
        {MOCK_TRACES.map((trace) => (
          <Card key={trace.id} data-testid={`trace-${trace.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-mono">{trace.operation}</CardTitle>
              <Badge variant={STATUS_VARIANT[trace.status]}>{trace.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">
                {trace.duration} · {trace.spanCount} spans
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
