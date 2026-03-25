import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface DependencyNode {
  id: string;
  name: string;
  type: "direct" | "dev" | "peer";
  version: string;
  dependents: number;
}

const MOCK_DEPENDENCIES: DependencyNode[] = [
  { id: "d1", name: "react", type: "direct", version: "18.3.1", dependents: 24 },
  { id: "d2", name: "vitest", type: "dev", version: "4.1.1", dependents: 8 },
  { id: "d3", name: "zod", type: "direct", version: "3.23.8", dependents: 12 },
  { id: "d4", name: "react-dom", type: "peer", version: "18.3.1", dependents: 3 },
];

const TYPE_VARIANT: Record<DependencyNode["type"], "default" | "secondary" | "destructive"> = {
  direct: "default",
  dev: "secondary",
  peer: "destructive",
};

export function DependencyGraphPanel() {
  return (
    <ProToolPanel title="Dependency Graph" status="ready">
      <div className="grid gap-3">
        {MOCK_DEPENDENCIES.map((d) => (
          <Card key={d.id} data-testid={`dep-${d.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{d.name}</CardTitle>
              <Badge variant={TYPE_VARIANT[d.type]}>{d.type}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                v{d.version} · {d.dependents} dependents
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
