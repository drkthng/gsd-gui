import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface Metric {
  id: string;
  name: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
}

const MOCK_METRICS: Metric[] = [
  { id: "m1", name: "Token Throughput", value: "1,240", unit: "tok/s", trend: "up" },
  { id: "m2", name: "Avg Latency", value: "245", unit: "ms", trend: "down" },
  { id: "m3", name: "Error Rate", value: "0.3", unit: "%", trend: "stable" },
  { id: "m4", name: "Memory Usage", value: "2.1", unit: "GB", trend: "up" },
  { id: "m5", name: "Active Agents", value: "4", unit: "agents", trend: "stable" },
];

const TREND_VARIANT: Record<Metric["trend"], "default" | "secondary" | "outline"> = {
  up: "default",
  down: "secondary",
  stable: "outline",
};

const TREND_ARROW: Record<Metric["trend"], string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};

export function MetricsPanel() {
  return (
    <ProToolPanel title="Metrics" status="ready">
      <div className="grid gap-3">
        {MOCK_METRICS.map((metric) => (
          <Card key={metric.id} data-testid={`metric-${metric.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <Badge variant={TREND_VARIANT[metric.trend]}>
                {TREND_ARROW[metric.trend]} {metric.trend}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold">
                {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
