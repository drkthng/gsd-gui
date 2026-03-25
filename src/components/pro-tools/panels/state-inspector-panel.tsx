import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface StateEntry {
  id: string;
  key: string;
  value: string;
  type: "string" | "number" | "boolean" | "object";
}

const MOCK_STATE: StateEntry[] = [
  { id: "st1", key: "currentModel", value: "claude-sonnet-4-20250514", type: "string" },
  { id: "st2", key: "maxTokens", value: "8192", type: "number" },
  { id: "st3", key: "streamEnabled", value: "true", type: "boolean" },
  { id: "st4", key: "toolConfig", value: '{"browser":true,"shell":true}', type: "object" },
];

const TYPE_VARIANT: Record<StateEntry["type"], "default" | "secondary" | "outline"> = {
  string: "default",
  number: "secondary",
  boolean: "outline",
  object: "secondary",
};

export function StateInspectorPanel() {
  return (
    <ProToolPanel title="State Inspector" status="ready">
      <div className="grid gap-3">
        {MOCK_STATE.map((entry) => (
          <Card key={entry.id} data-testid={`state-${entry.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{entry.key}</CardTitle>
              <Badge variant={TYPE_VARIANT[entry.type]}>{entry.type}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground font-mono">{entry.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
