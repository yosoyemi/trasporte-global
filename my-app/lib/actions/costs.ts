// lib/actions/costs.ts
"use server";

import { createServerClient } from "@/lib/supabase/server";

export type CostSummaryItem = {
  category:
    | "Mantenimientos Preventivos"
    | "Servicios Correctivos"
    | "Combustible"
    | "Repuestos y Materiales";
  amount: number;
  percentage: number;
};

export type CostBreakdown = {
  total: number;
  preventive: number;
  corrective: number;
  fuel: number;
  parts: number;
  items: CostSummaryItem[];
};

export type MonthlyTrendRow = {
  month: string;
  preventive: number;
  corrective: number;
  fuel: number;
};

export type DowntimeRow = {
  unit: string;
  totalDowntime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  availability: number;
};

function safeNumber(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

function monthShortEs(idx0: number) {
  return new Date(2000, idx0, 1).toLocaleString("es", { month: "short" });
}

type UnitShape = { unit_number: string };

// A veces Supabase devuelve la relación como arreglo
function normalizeUnit(u: unknown): UnitShape | null {
  if (!u) return null;
  if (Array.isArray(u)) {
    const first = u[0] as { unit_number?: unknown } | undefined;
    const val = first?.unit_number;
    return typeof val === "string" ? { unit_number: val } : null;
  }
  const obj = u as { unit_number?: unknown };
  return typeof obj.unit_number === "string" ? { unit_number: obj.unit_number } : null;
}

export async function getCostBreakdown(
  date_from: string,
  date_to: string
): Promise<CostBreakdown> {
  const supabase = createServerClient();

  // Services (preventive/corrective + parts)
  const { data: services } = await supabase
    .from("services")
    .select("service_type,total_cost,parts_cost,service_date")
    .gte("service_date", date_from)
    .lte("service_date", date_to);

  // Fuel
  const { data: fuels } = await supabase
    .from("fuel_consumption")
    .select("fuel_cost_usd,period_start")
    .gte("period_start", date_from)
    .lte("period_start", date_to);

  const svcList =
    (services ?? []) as {
      service_type: string | null;
      total_cost: number | null;
      parts_cost: number | null;
      service_date: string;
    }[];

  const fuelList =
    (fuels ?? []) as { fuel_cost_usd: number | null; period_start: string }[];

  const preventive = svcList
    .filter((s) => s.service_type === "preventive")
    .reduce((sum, s) => sum + safeNumber(s.total_cost), 0);

  const corrective = svcList
    .filter((s) => s.service_type === "corrective")
    .reduce((sum, s) => sum + safeNumber(s.total_cost), 0);

  const parts = svcList.reduce((sum, s) => sum + safeNumber(s.parts_cost), 0);

  const fuel = fuelList.reduce((sum, f) => sum + safeNumber(f.fuel_cost_usd), 0);

  const total = preventive + corrective + parts + fuel;

  const items: CostSummaryItem[] = [
    { category: "Mantenimientos Preventivos", amount: preventive, percentage: 0 },
    { category: "Servicios Correctivos", amount: corrective, percentage: 0 },
    { category: "Combustible", amount: fuel, percentage: 0 },
    { category: "Repuestos y Materiales", amount: parts, percentage: 0 },
  ];

  const denom = total || 1;
  items.forEach((i) => (i.percentage = Math.round((i.amount / denom) * 100)));
  // Ajuste por redondeo
  const diff = 100 - items.reduce((s, i) => s + i.percentage, 0);
  if (diff !== 0) items[0].percentage += diff;

  return { total, preventive, corrective, fuel, parts, items };
}

export async function getMonthlyTrend(year?: number): Promise<MonthlyTrendRow[]> {
  const supabase = createServerClient();
  const y = year ?? new Date().getFullYear();

  const { data: services } = await supabase
    .from("services")
    .select("service_type,total_cost,service_date")
    .gte("service_date", `${y}-01-01`)
    .lte("service_date", `${y}-12-31`);

  const { data: fuels } = await supabase
    .from("fuel_consumption")
    .select("fuel_cost_usd,period_start")
    .gte("period_start", `${y}-01-01`)
    .lte("period_start", `${y}-12-31`);

  const svcList =
    (services ?? []) as {
      service_type: string | null;
      total_cost: number | null;
      service_date: string;
    }[];
  const fuelList =
    (fuels ?? []) as { fuel_cost_usd: number | null; period_start: string }[];

  const months: MonthlyTrendRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: monthShortEs(i),
    preventive: 0,
    corrective: 0,
    fuel: 0,
  }));

  for (const s of svcList) {
    const m = new Date(s.service_date).getMonth();
    const cost = safeNumber(s.total_cost);
    if (s.service_type === "preventive") months[m].preventive += cost;
    else if (s.service_type === "corrective") months[m].corrective += cost;
  }

  for (const f of fuelList) {
    const m = new Date(f.period_start).getMonth();
    months[m].fuel += safeNumber(f.fuel_cost_usd);
  }

  return months;
}

export async function getDowntimeReport(
  date_from: string,
  date_to: string
): Promise<DowntimeRow[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("services")
    .select(
      `
      unit_id,
      service_type,
      downtime_hours,
      service_date,
      unit:units(unit_number)
    `
    )
    .gte("service_date", date_from)
    .lte("service_date", date_to);

  if (error) {
    console.error("getDowntimeReport error:", error);
    return [];
  }

  // tipado seguro
  type RowRaw = {
    unit_id: string | null;
    service_type: string | null;
    downtime_hours: number | null;
    service_date: string;
    unit: unknown;
  };

  const rowsRaw: RowRaw[] = (data ?? []) as RowRaw[];
  const byUnit = new Map<string, DowntimeRow>();

  for (const r of rowsRaw) {
    const key = normalizeUnit(r.unit)?.unit_number ?? "SIN-UNIDAD";
    const entry =
      byUnit.get(key) ??
      {
        unit: key,
        totalDowntime: 0,
        plannedDowntime: 0,
        unplannedDowntime: 0,
        availability: 100,
      };
    const h = safeNumber(r.downtime_hours ?? 0);
    entry.totalDowntime += h;
    if (r.service_type === "preventive") entry.plannedDowntime += h;
    else entry.unplannedDowntime += h;
    byUnit.set(key, entry);
  }

  // Cálculo simple sobre 720h (aprox. mes)
  const totalPeriodHours = 24 * 30;
  for (const v of byUnit.values()) {
    v.availability = Math.max(
      0,
      Number(((1 - v.totalDowntime / totalPeriodHours) * 100).toFixed(1))
    );
  }

  return Array.from(byUnit.values());
}
