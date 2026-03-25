import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProToolPanel } from "@/components/pro-tools/pro-tool-panel";

interface Worktree {
  id: string;
  path: string;
  branch: string;
  milestone?: string;
  status: "active" | "clean" | "dirty";
}

const MOCK_WORKTREES: Worktree[] = [
  { id: "w1", path: ".gsd/worktrees/M005", branch: "feat/pro-tools", milestone: "M005", status: "active" },
  { id: "w2", path: ".gsd/worktrees/M003", branch: "feat/dashboard", milestone: "M003", status: "clean" },
  { id: "w3", path: ".gsd/worktrees/M004", branch: "fix/auth-flow", milestone: "M004", status: "dirty" },
  { id: "w4", path: ".", branch: "main", status: "clean" },
];

const STATUS_VARIANT: Record<Worktree["status"], "default" | "secondary" | "destructive"> = {
  active: "default",
  clean: "secondary",
  dirty: "destructive",
};

export function WorktreePanel() {
  return (
    <ProToolPanel title="Worktree Manager" status="ready">
      <div className="grid gap-3">
        {MOCK_WORKTREES.map((wt) => (
          <Card key={wt.id} data-testid={`worktree-${wt.id}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium font-mono">{wt.branch}</CardTitle>
              <Badge variant={STATUS_VARIANT[wt.status]}>{wt.status}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground font-mono">{wt.path}</p>
              {wt.milestone && (
                <p className="mt-1 text-xs text-muted-foreground">Milestone: {wt.milestone}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ProToolPanel>
  );
}
