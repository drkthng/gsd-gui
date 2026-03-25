import { DollarSign } from "lucide-react";
import { CostOverview } from "@/components/dashboard/cost-overview";
import { mockCostData } from "@/test/mock-data";

export function CostsPage() {
  // TODO: Replace with real data from metrics.json
  const data = mockCostData;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-6 w-6 text-primary" data-testid="page-icon" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Costs</h1>
          <p className="text-sm text-muted-foreground">
            Monitor budget, cost breakdown, and spending trends.
          </p>
        </div>
      </div>
      <CostOverview data={data} />
    </div>
  );
}
