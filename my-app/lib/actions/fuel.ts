// lib/actions/fuel.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type FuelConsumption = {
  id: string
  unit_id: string | null
  period_start: string
  period_end: string
  period_type: "weekly" | "monthly"
  fuel_consumed_liters: number
  hours_operated: number
  efficiency_lph: number | null
  fuel_cost_usd: number | null
  notes: string | null
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    fuel_type: string
  } | null
}

export type CreateFuelConsumptionData = {
  unit_id: string
  period_type: "weekly" | "monthly"
  period_start: string // YYYY-MM-DD
  period_end: string   // YYYY-MM-DD
  fuel_consumed_liters: number
  hours_operated: number
  /** Si lo envías, calculo fuel_cost_usd = litros * cost_per_liter */
  cost_per_liter?: number
  /** O puedes mandar el total ya calculado */
  fuel_cost_usd?: number
  notes?: string
}

export type UpdateFuelConsumptionData = Partial<CreateFuelConsumptionData> & {
  id: string
}

function calcEfficiency(liters: number, hours: number) {
  return hours > 0 ? liters / hours : 0
}

export async function createFuelConsumption(data: CreateFuelConsumptionData) {
  const supabase = createServerClient()
  try {
    const efficiency_lph = calcEfficiency(data.fuel_consumed_liters, data.hours_operated)
    const total_cost =
      typeof data.fuel_cost_usd === "number"
        ? data.fuel_cost_usd
        : typeof data.cost_per_liter === "number"
        ? data.fuel_consumed_liters * data.cost_per_liter
        : null

    const payload = {
      unit_id: data.unit_id,
      period_type: data.period_type,
      period_start: data.period_start,
      period_end: data.period_end,
      fuel_consumed_liters: data.fuel_consumed_liters,
      hours_operated: data.hours_operated,
      efficiency_lph,
      fuel_cost_usd: total_cost,
      notes: data.notes ?? null,
    }

    const { data: row, error } = await supabase.from("fuel_consumption").insert([payload]).select("*").single()
    if (error) throw new Error(`Error creating fuel consumption: ${error.message}`)

    revalidatePath("/fuel")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: row as FuelConsumption }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function updateFuelConsumption(data: UpdateFuelConsumptionData) {
  const supabase = createServerClient()
  try {
    const { id, ...rest } = data

    // recalcular eficiencia y costo si cambian litros/horas/costo
    let efficiency_lph: number | undefined
    let fuel_cost_usd: number | undefined

    if (
      rest.fuel_consumed_liters !== undefined ||
      rest.hours_operated !== undefined ||
      rest.cost_per_liter !== undefined ||
      rest.fuel_cost_usd !== undefined
    ) {
      const { data: current } = await supabase.from("fuel_consumption").select("*").eq("id", id).single()

      const liters =
        rest.fuel_consumed_liters ?? (current?.fuel_consumed_liters as number | undefined) ?? 0
      const hours =
        rest.hours_operated ?? (current?.hours_operated as number | undefined) ?? 0
      efficiency_lph = calcEfficiency(liters, hours)

      if (typeof rest.fuel_cost_usd === "number") {
        fuel_cost_usd = rest.fuel_cost_usd
      } else if (typeof rest.cost_per_liter === "number") {
        fuel_cost_usd = liters * rest.cost_per_liter
      }
    }

    // Tipado estricto del payload de actualización
    type FuelUpdatePayload = Partial<
      Pick<
        FuelConsumption,
        | "unit_id"
        | "period_type"
        | "period_start"
        | "period_end"
        | "fuel_consumed_liters"
        | "hours_operated"
        | "efficiency_lph"
        | "fuel_cost_usd"
        | "notes"
      >
    > & { updated_at: string }

    const updatePayload: FuelUpdatePayload = { updated_at: new Date().toISOString() }

    if (rest.unit_id !== undefined) updatePayload.unit_id = rest.unit_id
    if (rest.period_type !== undefined) updatePayload.period_type = rest.period_type
    if (rest.period_start !== undefined) updatePayload.period_start = rest.period_start
    if (rest.period_end !== undefined) updatePayload.period_end = rest.period_end
    if (rest.fuel_consumed_liters !== undefined) updatePayload.fuel_consumed_liters = rest.fuel_consumed_liters
    if (rest.hours_operated !== undefined) updatePayload.hours_operated = rest.hours_operated
    if (rest.notes !== undefined) updatePayload.notes = rest.notes

    if (efficiency_lph !== undefined) updatePayload.efficiency_lph = efficiency_lph
    if (fuel_cost_usd !== undefined) updatePayload.fuel_cost_usd = fuel_cost_usd
    // Nota: no incluimos cost_per_liter porque no es columna de la tabla

    const { data: row, error } = await supabase
      .from("fuel_consumption")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw new Error(`Error updating fuel consumption: ${error.message}`)

    revalidatePath("/fuel")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: row as FuelConsumption }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function deleteFuelConsumption(id: string) {
  const supabase = createServerClient()
  try {
    const { error } = await supabase.from("fuel_consumption").delete().eq("id", id)
    if (error) throw new Error(`Error deleting fuel consumption: ${error.message}`)
    revalidatePath("/fuel")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getFuelConsumption(filters?: {
  unit_id?: string
  period_type?: string
  date_from?: string
  date_to?: string
}) {
  const supabase = createServerClient()
  try {
    let query = supabase
      .from("fuel_consumption")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, fuel_type)
      `,
      )
      .order("period_start", { ascending: false })

    if (filters?.unit_id && filters.unit_id !== "all") query = query.eq("unit_id", filters.unit_id)
    if (filters?.period_type && filters.period_type !== "all") query = query.eq("period_type", filters.period_type)
    if (filters?.date_from) query = query.gte("period_start", filters.date_from)
    if (filters?.date_to) query = query.lte("period_end", filters.date_to)

    const { data, error } = await query
    if (error) throw new Error(`Error fetching fuel consumption: ${error.message}`)

    return { success: true, data: (data ?? []) as FuelConsumption[] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as FuelConsumption[] }
  }
}

export async function getFuelConsumptionById(id: string) {
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase
      .from("fuel_consumption")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, fuel_type, status)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw new Error(`Error fetching fuel consumption: ${error.message}`)
    return { success: true, data: data as FuelConsumption }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export type FuelSummary = {
  total_records: number
  total_liters: number
  total_cost_usd: number
  total_hours: number
  average_efficiency: number
}

export async function getFuelConsumptionSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()
  try {
    let query = supabase.from("fuel_consumption").select("fuel_consumed_liters, fuel_cost_usd, hours_operated, efficiency_lph")

    if (filters?.date_from) query = query.gte("period_start", filters.date_from)
    if (filters?.date_to) query = query.lte("period_end", filters.date_to)

    const { data, error } = await query
    if (error) throw new Error(`Error fetching fuel consumption summary: ${error.message}`)

    type Lite = Pick<FuelConsumption, "fuel_consumed_liters" | "fuel_cost_usd" | "hours_operated" | "efficiency_lph">
    const arr = (data ?? []) as Lite[]

    const summary: FuelSummary = {
      total_records: arr.length,
      total_liters: arr.reduce((s, r) => s + (r.fuel_consumed_liters ?? 0), 0),
      total_cost_usd: arr.reduce((s, r) => s + (r.fuel_cost_usd ?? 0), 0),
      total_hours: arr.reduce((s, r) => s + (r.hours_operated ?? 0), 0),
      average_efficiency: arr.length ? arr.reduce((s, r) => s + (r.efficiency_lph ?? 0), 0) / arr.length : 0,
    }

    return { success: true, data: summary }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export type FuelTrendRow = {
  month: string // YYYY-MM
  liters: number
  cost_usd: number
  avg_efficiency: number
  records: number
}

export async function getFuelTrends(unitId?: string, months = 6) {
  const supabase = createServerClient()
  try {
    const start = new Date()
    start.setMonth(start.getMonth() - months)
    const startStr = start.toISOString().slice(0, 10)

    let query = supabase
      .from("fuel_consumption")
      .select("period_start, fuel_consumed_liters, fuel_cost_usd, efficiency_lph, unit_id")
      .gte("period_start", startStr)
      .order("period_start", { ascending: true })

    if (unitId && unitId !== "all") query = query.eq("unit_id", unitId)

    const { data, error } = await query
    if (error) throw new Error(`Error fetching fuel trends: ${error.message}`)

    type Row = Pick<FuelConsumption, "period_start" | "fuel_consumed_liters" | "fuel_cost_usd" | "efficiency_lph">
    const byMonth = (data as Row[] | null)?.reduce<Record<
      string,
      { liters: number; cost: number; effs: number[]; records: number }
    >>((acc, r) => {
      const m = r.period_start.substring(0, 7)
      acc[m] ||= { liters: 0, cost: 0, effs: [], records: 0 }
      acc[m].liters += r.fuel_consumed_liters ?? 0
      acc[m].cost += r.fuel_cost_usd ?? 0
      acc[m].effs.push(r.efficiency_lph ?? 0)
      acc[m].records += 1
      return acc
    }, {})

    const rows: FuelTrendRow[] = Object.entries(byMonth ?? {}).map(([m, v]) => ({
      month: m,
      liters: v.liters,
      cost_usd: v.cost,
      avg_efficiency: v.effs.reduce((s, e) => s + e, 0) / (v.effs.length || 1),
      records: v.records,
    }))

    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as FuelTrendRow[] }
  }
}

export type EfficiencyComparisonRow = {
  unit_id: string
  unit_number: string
  brand: string
  model: string
  fuel_type: string
  total_liters: number
  total_cost_usd: number
  readings: number[]
  records: number
  avg_efficiency: number
}

export async function getEfficiencyComparison() {
  const supabase = createServerClient()
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from("fuel_consumption")
      .select(`
        unit_id,
        fuel_consumed_liters,
        fuel_cost_usd,
        efficiency_lph,
        unit:units(unit_number, brand, model, fuel_type)
      `)
      .gte("period_start", since)

    if (error) throw new Error(`Error fetching efficiency comparison: ${error.message}`)

    type Row = {
      unit_id: string
      fuel_consumed_liters: number | null
      fuel_cost_usd: number | null
      efficiency_lph: number | null
      unit: { unit_number?: string | null; brand?: string | null; model?: string | null; fuel_type?: string | null } | null
    }

    const map = (data as Row[] | null)?.reduce<Record<string, EfficiencyComparisonRow>>((acc, r) => {
      acc[r.unit_id] ||= {
        unit_id: r.unit_id,
        unit_number: r.unit?.unit_number ?? "",
        brand: r.unit?.brand ?? "",
        model: r.unit?.model ?? "",
        fuel_type: r.unit?.fuel_type ?? "",
        total_liters: 0,
        total_cost_usd: 0,
        readings: [],
        records: 0,
        avg_efficiency: 0,
      }
      acc[r.unit_id].total_liters += r.fuel_consumed_liters ?? 0
      acc[r.unit_id].total_cost_usd += r.fuel_cost_usd ?? 0
      acc[r.unit_id].readings.push(r.efficiency_lph ?? 0)
      acc[r.unit_id].records += 1
      return acc
    }, {})

    const rows = Object.values(map ?? {}).map((u) => ({
      ...u,
      avg_efficiency: u.readings.length ? u.readings.reduce((s, e) => s + e, 0) / u.readings.length : 0,
    }))

    return { success: true, data: rows }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as EfficiencyComparisonRow[] }
  }
}
