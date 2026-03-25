import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface CoverageEntry {
  id: string;
  file: string;
  statements: number;
  branches: number;
  functions: number;
  status: "covered" | "partial" | "uncovered";
}

const MOCK_COVERAGE: CoverageEntry[] = [
  { id: "c1", file: "src/router.tsx", statements: 98, branches: 92, functions: 100, status: "covered" },
  { id: "c2", file: "src/stores/gsd-store.ts", statements: 74, branches: 60, functions: 80, status: "partial" },
  { id: "c3", file: "src/lib/utils.ts", statements: 100, branches: 100, functions: 100, status: "covered" },
  { id: "c4", file: "src/services/gsd-client.ts", statements: 12, branches: 0, functions: 10, status: "uncovered" },
];

const STATUS_VARIANT: Record<CoverageEntry["status"], "default" | "secondary" | "destructive"> = {
  covered: "default",
  partial: "secondary",
  uncovered: "destructive",
};

export function CoverageMapPanel() {
  return (
    <ProToolPanel title="Coverage Map" status="ready">
      <div className="grid gap-3">
        {MOCK_COVERAGE.map((c) => (
          <Card key={c.id} data-testid={`cov-${c.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.file}</CardTitle>
              <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Stmts: {c.statements}% · Branches: {c.branches}% · Fns: {c.functions}%
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
