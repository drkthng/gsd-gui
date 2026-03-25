import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CostData } from "@/lib/types";

interface CostOverviewProps {
  data: CostData;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function CostOverview({ data }: CostOverviewProps) {
  const budgetPct = data.budgetCeiling
    ? Math.round((data.totalCost / data.budgetCeiling) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Budget bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono font-medium">${data.totalCost.toFixed(2)}</span>
            {data.budgetCeiling ? (
              <span className="text-muted-foreground">
                of <span className="font-mono">${data.budgetCeiling.toFixed(2)}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">No budget set</span>
            )}
          </div>
          {budgetPct !== null && (
            <>
              <Progress
                value={budgetPct}
                className={`h-2 ${budgetPct > 80 ? "[&>div]:bg-red-500" : budgetPct > 60 ? "[&>div]:bg-yellow-500" : ""}`}
              />
              <p className="text-xs text-muted-foreground text-right">{budgetPct}% used</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Phase breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost by Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byPhase}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.byModel}
                  dataKey="cost"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name }) => name}
                >
                  {data.byModel.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per-slice cost table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cost by Slice</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2">Slice</th>
                <th className="pb-2">Title</th>
                <th className="pb-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.bySlice.map((s) => (
                <tr key={s.sliceId} className="border-b last:border-0">
                  <td className="py-1.5 font-mono text-xs">{s.sliceId}</td>
                  <td className="py-1.5">{s.title}</td>
                  <td className="py-1.5 text-right font-mono">${s.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
