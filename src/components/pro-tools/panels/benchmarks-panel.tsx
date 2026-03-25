import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface BenchmarkResult {
  id: string;
  name: string;
  duration: number;
  status: "passed" | "failed" | "running";
  score: number;
}

const MOCK_BENCHMARKS: BenchmarkResult[] = [
  { id: "b1", name: "Tool Selection Latency", duration: 142, status: "passed", score: 95 },
  { id: "b2", name: "Context Window Fill", duration: 3200, status: "passed", score: 88 },
  { id: "b3", name: "Multi-Agent Routing", duration: 780, status: "failed", score: 42 },
  { id: "b4", name: "Streaming Throughput", duration: 0, status: "running", score: 0 },
];

const STATUS_VARIANT: Record<BenchmarkResult["status"], "default" | "secondary" | "destructive"> = {
  passed: "default",
  failed: "destructive",
  running: "secondary",
};

export function BenchmarksPanel() {
  return (
    <ProToolPanel title="Benchmarks" status="ready">
      <div className="grid gap-3">
        {MOCK_BENCHMARKS.map((b) => (
          <Card key={b.id} data-testid={`bench-${b.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{b.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[b.status]}>{b.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {b.duration}ms · Score: {b.score}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
