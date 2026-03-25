import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  category: "agent" | "project" | "system";
}

const MOCK_CONFIG: ConfigItem[] = [
  { id: "cfg1", key: "defaultModel", value: "claude-sonnet-4-20250514", category: "agent" },
  { id: "cfg2", key: "maxConcurrency", value: "4", category: "project" },
  { id: "cfg3", key: "logLevel", value: "debug", category: "system" },
  { id: "cfg4", key: "autoCommit", value: "true", category: "project" },
];

const CATEGORY_VARIANT: Record<ConfigItem["category"], "default" | "secondary" | "outline"> = {
  agent: "default",
  project: "secondary",
  system: "outline",
};

export function ConfigEditorPanel() {
  return (
    <ProToolPanel title="Config Editor" status="ready">
      <div className="grid gap-3">
        {MOCK_CONFIG.map((item) => (
          <Card key={item.id} data-testid={`config-${item.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{item.key}</CardTitle>
              <Badge variant={CATEGORY_VARIANT[item.category]}>{item.category}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground font-mono">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
