// my-app/components/cost-charts.tsx
"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export type PieItem = { category: string; amount: number; percentage: number }
export type MonthlyTrendItem = { month: string; preventive: number; corrective: number; fuel: number }

export default function CostCharts({
  pieData,
  monthly,
}: {
  pieData: PieItem[]
  monthly: MonthlyTrendItem[]
}) {
  return (
    <>
      <ChartContainer config={{ amount: { label: "Monto", color: "hsl(var(--chart-1))" } }} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="amount">
              {pieData.map((_, index) => (
                <Cell key={index} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>

      <ChartContainer
        config={{
          preventive: { label: "Preventivo", color: "hsl(var(--chart-1))" },
          corrective: { label: "Correctivo", color: "hsl(var(--chart-2))" },
          fuel: { label: "Combustible", color: "hsl(var(--chart-3))" },
        }}
        className="h-[400px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="preventive" stackId="a" fill="var(--color-preventive)" />
            <Bar dataKey="corrective" stackId="a" fill="var(--color-corrective)" />
            <Bar dataKey="fuel" stackId="a" fill="var(--color-fuel)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </>
  )
}
