import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface AbTest {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  winner: "A" | "B" | "pending";
}

const MOCK_TESTS: AbTest[] = [
  { id: "ab1", name: "Prompt Format", variantA: "Markdown", variantB: "Plain Text", winner: "A" },
  { id: "ab2", name: "Temperature", variantA: "0.3", variantB: "0.7", winner: "B" },
  { id: "ab3", name: "System Message Length", variantA: "Short", variantB: "Detailed", winner: "pending" },
  { id: "ab4", name: "Tool Call Strategy", variantA: "Parallel", variantB: "Sequential", winner: "A" },
];

const WINNER_VARIANT: Record<AbTest["winner"], "default" | "secondary" | "destructive"> = {
  A: "default",
  B: "secondary",
  pending: "destructive",
};

export function AbTestingPanel() {
  return (
    <ProToolPanel title="A/B Testing" status="ready">
      <div className="grid gap-3">
        {MOCK_TESTS.map((t) => (
          <Card key={t.id} data-testid={`ab-${t.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.name}</CardTitle>
              <Badge variant={WINNER_VARIANT[t.winner]}>Winner: {t.winner}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                A: {t.variantA} vs B: {t.variantB}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
