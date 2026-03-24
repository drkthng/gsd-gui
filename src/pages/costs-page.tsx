import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function CostsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Costs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor API costs and resource usage.
          </p>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">Total Spend</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">This Month</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">$24.50</div>
            <div className="mt-0.5 text-xs text-muted-foreground">+12% from last month</div>
          </div>
          <div className="rounded-md border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Today</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">$1.20</div>
            <div className="mt-0.5 text-xs text-muted-foreground">-8% from yesterday</div>
          </div>
          <div className="rounded-md border bg-background p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg / Day</span>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">$0.82</div>
            <div className="mt-0.5 text-xs text-muted-foreground">Last 30 days</div>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border bg-card p-4 text-card-foreground"
        data-testid="mock-section"
      >
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Cost Breakdown
        </h2>
        <div className="space-y-2">
          {[
            { model: "Claude Sonnet", calls: 142, cost: "$18.40", pct: 75 },
            { model: "Claude Haiku", calls: 89, cost: "$3.20", pct: 13 },
            { model: "Embeddings", calls: 310, cost: "$1.55", pct: 6 },
            { model: "Other", calls: 24, cost: "$1.35", pct: 6 },
          ].map((row) => (
            <div
              key={row.model}
              className="flex items-center gap-3 text-sm"
            >
              <span className="w-28 text-foreground">{row.model}</span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                {row.cost}
              </span>
              <span className="w-16 text-right text-xs text-muted-foreground">
                {row.calls} calls
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
