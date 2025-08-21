// my-app/lib/actions/costs.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"

/* =========================
 * Tipos públicos
 * ========================= */
export type PeriodKey = "current_month" | "last_month" | "quarter" | "year"

export type CostSummaryItem = {
  category:
    | "Mantenimientos Preventivos"
    | "Servicios Correctivos"
    | "Combustible"
    | "Repuestos y Materiales"
  amount: number
  percentage: number
}

export type CostBreakdown = {
  total: number
  preventive: number
  corrective: number
  fuel: number
  parts: number
  items: CostSummaryItem[]
}

export type MonthlyTrendRow = {
  month: string
  preventive: number
  corrective: number
  fuel: number
}

export type DowntimeRow = {
  unit: string
  totalDowntime: number
  plannedDowntime: number
  unplannedDowntime: number
  availability: number
}

/* =========================
 * Utilidades
 * ========================= */
function safeNumber(n: number | null | undefined) {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0
}

function monthShortEs(idx0: number) {
  return new Date(2000, idx0, 1).toLocaleString("es-ES", { month: "short" }).replace(".", "")
}

// A veces Supabase devuelve la relación como arreglo
function normalizeUnit(u: any): { unit_number: string } | null {
  if (!u) return null
  if (Array.isArray(u)) {
    const first = u[0]
    return first && typeof first.unit_number === "string" ? { unit_number: first.unit_number } : null
  }
  if (typeof u.unit_number === "string") return { unit_number: u.unit_number }
  return null
}

/** Devuelve rango [from, to] (YYYY-MM-DD) para un período lógico */
export function periodToRange(period: PeriodKey): { from: string; to: string } {
  const today = new Date()
  // 'end' como hoy (sin horas para evitar desfaces TZ en slice)
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let start = new Date(end)

  switch (period) {
    case "current_month":
      start = new Date(end.getFullYear(), end.getMonth(), 1)
      break
    case "last_month": {
      const m = end.getMonth() - 1
      const y = m < 0 ? end.getFullYear() - 1 : end.getFullYear()
      const mm = (m + 12) % 12
      start = new Date(y, mm, 1)
      // Último día del mes anterior
      end.setFullYear(y, mm + 1, 0)
      break
    }
    case "quarter": {
      // últimos 3 meses (aprox)
      const m = end.getMonth()
      start = new Date(end.getFullYear(), m - 2, 1)
      break
    }
    case "year":
      start = new Date(end.getFullYear(), 0, 1)
      break
  }

  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  }
}

/* =========================
 * Consultas
 * ========================= */

/** Costos por categoría (preventive/corrective/parts desde services y fuel desde fuel_consumption) */
export async function getCostBreakdown(
  from: string,
  to: string,
): Promise<CostBreakdown> {
  const supabase = createServerClient()

  // Services (preventive/corrective + parts)
  const { data: services, error: svcErr } = await supabase
    .from("services")
    .select("service_type,total_cost,parts_cost,service_date")
    .gte("service_date", from)
    .lte("service_date", to)

  if (svcErr) throw new Error(svcErr.message)

  // Fuel
  const { data: fuels, error: fuelErr } = await supabase
    .from("fuel_consumption")
    .select("fuel_cost_usd,period_start,period_end")
    .gte("period_start", from)
    .lte("period_end", to)

  if (fuelErr) throw new Error(fuelErr.message)

  const svcList =
    (services ?? []) as {
      service_type: string | null
      total_cost: number | null
      parts_cost: number | null
      service_date: string
    }[]

  const fuelList =
    (fuels ?? []) as {
      fuel_cost_usd: number | null
      period_start: string
      period_end: string
    }[]

  const preventive = svcList
    .filter((s) => s.service_type === "preventive")
    .reduce((sum, s) => sum + safeNumber(s.total_cost), 0)

  const corrective = svcList
    .filter((s) => s.service_type === "corrective")
    .reduce((sum, s) => sum + safeNumber(s.total_cost), 0)

  const parts = svcList.reduce((sum, s) => sum + safeNumber(s.parts_cost), 0)
  const fuel = fuelList.reduce((sum, f) => sum + safeNumber(f.fuel_cost_usd), 0)

  const total = preventive + corrective + parts + fuel

  const items: CostSummaryItem[] = [
    { category: "Mantenimientos Preventivos", amount: preventive, percentage: 0 },
    { category: "Servicios Correctivos", amount: corrective, percentage: 0 },
    { category: "Combustible", amount: fuel, percentage: 0 },
    { category: "Repuestos y Materiales", amount: parts, percentage: 0 },
  ]

  const denom = total || 1
  items.forEach((i) => (i.percentage = Math.round((i.amount / denom) * 100)))
  // Ajuste por redondeo
  const diff = 100 - items.reduce((s, i) => s + i.percentage, 0)
  if (diff !== 0) items[0].percentage += diff

  return { total, preventive, corrective, fuel, parts, items }
}

/** Tendencia mensual combinada (services + fuel_consumption) para el año en curso */
export async function getMonthlyTrend(year?: number): Promise<MonthlyTrendRow[]> {
  const supabase = createServerClient()
  const y = year ?? new Date().getFullYear()

  const { data: services, error: svcErr } = await supabase
    .from("services")
    .select("service_type,total_cost,service_date")
    .gte("service_date", `${y}-01-01`)
    .lte("service_date", `${y}-12-31`)

  if (svcErr) throw new Error(svcErr.message)

  const { data: fuels, error: fuelErr } = await supabase
    .from("fuel_consumption")
    .select("fuel_cost_usd,period_start")
    .gte("period_start", `${y}-01-01`)
    .lte("period_start", `${y}-12-31`)

  if (fuelErr) throw new Error(fuelErr.message)

  const svcList =
    (services ?? []) as { service_type: string | null; total_cost: number | null; service_date: string }[]
  const fuelList =
    (fuels ?? []) as { fuel_cost_usd: number | null; period_start: string }[]

  const months: MonthlyTrendRow[] = Array.from({ length: 12 }, (_, i) => ({
    month: monthShortEs(i),
    preventive: 0,
    corrective: 0,
    fuel: 0,
  }))

  for (const s of svcList) {
    const m = new Date(s.service_date).getMonth()
    const cost = safeNumber(s.total_cost)
    if (s.service_type === "preventive") months[m].preventive += cost
    else if (s.service_type === "corrective") months[m].corrective += cost
  }

  for (const f of fuelList) {
    const m = new Date(f.period_start).getMonth()
    months[m].fuel += safeNumber(f.fuel_cost_usd)
  }

  return months
}

/** Reporte de downtime por unidad usando services */
export async function getDowntimeReport(from: string, to: string): Promise<DowntimeRow[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("services")
    .select(
      `
      unit_id,
      service_type,
      downtime_hours,
      service_date,
      unit:units(unit_number)
    `,
    )
    .gte("service_date", from)
    .lte("service_date", to)

  if (error) {
    console.error("getDowntimeReport error:", error)
    return []
  }

  const rowsRaw = (data ?? []) as any[]
  const rows = rowsRaw.map((r) => ({
    unit_id: r.unit_id ?? null,
    service_type: r.service_type ?? null,
    downtime_hours: typeof r.downtime_hours === "number" ? r.downtime_hours : 0,
    service_date: String(r.service_date),
    unit: normalizeUnit(r.unit),
  }))

  const byUnit = new Map<string, DowntimeRow>()
  for (const r of rows) {
    const key = r.unit?.unit_number ?? "SIN-UNIDAD"
    const entry =
      byUnit.get(key) ??
      { unit: key, totalDowntime: 0, plannedDowntime: 0, unplannedDowntime: 0, availability: 100 }
    const h = safeNumber(r.downtime_hours)
    entry.totalDowntime += h
    if (r.service_type === "preventive") entry.plannedDowntime += h
    else entry.unplannedDowntime += h
    byUnit.set(key, entry)
  }

  // Cálculo simple sobre ~720h/mes (ajusta a tu operación real)
  const totalPeriodHours = 24 * 30
  for (const v of byUnit.values()) {
    v.availability = Math.max(0, Number(((1 - v.totalDowntime / totalPeriodHours) * 100).toFixed(1)))
  }

  return Array.from(byUnit.values()).sort((a, b) => a.unit.localeCompare(b.unit))
}
