"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DailyEntry {
  date: string;
  billableHours: number;
  nonBillableHours: number;
}

interface SummaryChartsProps {
  dailyData: DailyEntry[];
  stats: {
    billableHours: number;
    nonBillableHours: number;
    aiHours: number;
    totalHours: number;
  };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PIE_COLORS = ["#22c55e", "#f59e0b", "#a855f7"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{formatDate(label)}</p>
      {payload.map((p: { name: string; value: number; fill: string }) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  );
}

export function SummaryCharts({ dailyData, stats }: SummaryChartsProps) {
  const pieData = [
    { name: "Billable", value: stats.billableHours },
    { name: "Non-Billable", value: stats.nonBillableHours },
    { name: "AI Assisted", value: stats.aiHours },
  ].filter((d) => d.value > 0);

  const hasData = dailyData.some(
    (d) => d.billableHours > 0 || d.nonBillableHours > 0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Daily Hours</h3>
        {!hasData ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={dailyData}
              margin={{ top: 0, right: 4, left: -24, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(128,128,128,0.15)"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="billableHours"
                name="Billable"
                stackId="a"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="nonBillableHours"
                name="Non-Billable"
                stackId="a"
                fill="#f59e0b"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-4">Hours Breakdown</h3>
        {pieData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="42%"
                innerRadius={52}
                outerRadius={76}
                dataKey="value"
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(value, entry) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  `${value}: ${(entry as any).payload.value}h`
                }
                iconSize={8}
                wrapperStyle={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [`${value}h`]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
