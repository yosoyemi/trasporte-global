// components/dashboard-charts.tsx (Client-only Recharts)
"use client"

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type FuelPoint = { month: string; liters: number }
type CostPoint = { month: string; cost: number }
type StatusPoint = { name: string; value: number; color: string }

export function FuelChart({ data }: { data: FuelPoint[] }) {
  return (
    <ChartContainer
      config={{
        liters: {
          label: "Consumo (L)",
          color: "hsl(var(--primary))",
        },
      }}
      className="h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" className="text-muted-foreground" />
          <YAxis className="text-muted-foreground" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="liters" stroke="hsl(var(--primary))" strokeWidth={2} />
        </ReLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function MonthlyCostsChart({ data }: { data: CostPoint[] }) {
  return (
    <ChartContainer
      config={{
        cost: {
          label: "Costo ($)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="month" className="text-muted-foreground" />
          <YAxis className="text-muted-foreground" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="cost" fill="hsl(var(--chart-2))" />
        </ReBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function StatusPieChart({ data }: { data: StatusPoint[] }) {
  return (
    <ChartContainer
      config={{
        value: {
          label: "Unidades",
        },
      }}
      className="h-[200px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RePieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </RePieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
