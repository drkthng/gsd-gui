import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface ResourceEntry {
  id: string;
  resource: "CPU" | "Memory" | "Disk" | "Network";
  usage: string;
  status: "healthy" | "warning" | "critical";
}

const MOCK_RESOURCES: ResourceEntry[] = [
  { id: "r1", resource: "CPU", usage: "34%", status: "healthy" },
  { id: "r2", resource: "Memory", usage: "78%", status: "warning" },
  { id: "r3", resource: "Disk", usage: "92%", status: "critical" },
  { id: "r4", resource: "Network", usage: "12%", status: "healthy" },
];

const STATUS_VARIANT: Record<ResourceEntry["status"], "default" | "secondary" | "destructive"> = {
  healthy: "default",
  warning: "secondary",
  critical: "destructive",
};

export function ResourceMonitorPanel() {
  return (
    <ProToolPanel title="Resource Monitor" status="ready">
      <div className="grid gap-3">
        {MOCK_RESOURCES.map((r) => (
          <Card key={r.id} data-testid={`resource-${r.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{r.resource}</CardTitle>
              <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Usage: {r.usage}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
