import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface TokenUsageRecord {
  id: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  date: string;
}

const MOCK_TOKEN_USAGE: TokenUsageRecord[] = [
  { id: "t1", model: "claude-3.5-sonnet", inputTokens: 12400, outputTokens: 3200, cost: 0.078, date: "2025-03-20" },
  { id: "t2", model: "gpt-4o", inputTokens: 8600, outputTokens: 2100, cost: 0.054, date: "2025-03-21" },
  { id: "t3", model: "claude-3-haiku", inputTokens: 45000, outputTokens: 12000, cost: 0.014, date: "2025-03-22" },
  { id: "t4", model: "gemini-pro", inputTokens: 6200, outputTokens: 1800, cost: 0.032, date: "2025-03-23" },
];

export function TokenUsagePanel() {
  return (
    <ProToolPanel title="Token Usage" status="ready">
      <div className="grid gap-3">
        {MOCK_TOKEN_USAGE.map((t) => (
          <Card key={t.id} data-testid={`token-${t.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.model}</CardTitle>
              <Badge variant="secondary">${t.cost.toFixed(3)}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                In: {t.inputTokens.toLocaleString()} · Out: {t.outputTokens.toLocaleString()} · {t.date}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
