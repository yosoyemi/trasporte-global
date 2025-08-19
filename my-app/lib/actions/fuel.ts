// my-app/lib/actions/fuel.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type FuelConsumption = {
  id: string
  unit_id: string
  period_type: "weekly" | "monthly"
  period_start: string
  period_end: string
  liters_consumed: number
  hours_operated: number
  efficiency_lph: number
  cost_per_liter: number
  total_cost: number
  odometer_start: number
  odometer_end: number
  notes: string | null
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    fuel_type: string
  }
}

export type CreateFuelConsumptionData = {
  unit_id: string
  period_type: "weekly" | "monthly"
  period_start: string
  period_end: string
  liters_consumed: number
  hours_operated: number
  cost_per_liter: number
  odometer_start: number
  odometer_end: number
  notes?: string
}

export type UpdateFuelConsumptionData = Partial<CreateFuelConsumptionData> & {
  id: string
}

export async function createFuelConsumption(data: CreateFuelConsumptionData) {
  const supabase = createServerClient()

  try {
    const efficiency_lph = data.hours_operated > 0 ? data.liters_consumed / data.hours_operated : 0
    const total_cost = data.liters_consumed * data.cost_per_liter

    const { data: fuelRecord, error } = await supabase
      .from("fuel_consumption")
      .insert([
        {
          ...data,
          efficiency_lph,
          total_cost,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(`Error creating fuel consumption: ${error.message}`)

    await updateUnitHoursFromFuel(data.unit_id, data.odometer_end)

    revalidatePath("/fuel")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: fuelRecord as FuelConsumption }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function updateFuelConsumption(data: UpdateFuelConsumptionData) {
  const supabase = createServerClient()

  try {
    const { id, ...updateData } = data

    let calculatedFields: Partial<Pick<FuelConsumption, "efficiency_lph" | "total_cost">> = {}
    if (updateData.liters_consumed !== undefined || updateData.hours_operated !== undefined) {
      const { data: currentRecord } = await supabase.from("fuel_consumption").select("*").eq("id", id).single()

      const liters = updateData.liters_consumed ?? (currentRecord?.liters_consumed as number | undefined) ?? 0
      const hours = updateData.hours_operated ?? (currentRecord?.hours_operated as number | undefined) ?? 0
      const costPerLiter = updateData.cost_per_liter ?? (currentRecord?.cost_per_liter as number | undefined) ?? 0

      calculatedFields = {
        efficiency_lph: hours > 0 ? liters / hours : 0,
        total_cost: liters * costPerLiter,
      }
    }

    const { data: fuelRecord, error } = await supabase
      .from("fuel_consumption")
      .update({
        ...updateData,
        ...calculatedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Error updating fuel consumption: ${error.message}`)

    revalidatePath("/fuel")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: fuelRecord as FuelConsumption }
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

    if (filters?.unit_id) query = query.eq("unit_id", filters.unit_id)
    if (filters?.period_type && filters.period_type !== "all") query = query.eq("period_type", filters.period_type)
    if (filters?.date_from) query = query.gte("period_start", filters.date_from)
    if (filters?.date_to) query = query.lte("period_end", filters.date_to)

    const { data: fuelRecords, error } = await query
    if (error) throw new Error(`Error fetching fuel consumption: ${error.message}`)

    return { success: true, data: (fuelRecords ?? []) as FuelConsumption[] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as FuelConsumption[] }
  }
}

export async function getFuelConsumptionById(id: string) {
  const supabase = createServerClient()

  try {
    const { data: fuelRecord, error } = await supabase
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
    return { success: true, data: fuelRecord as FuelConsumption }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getFuelConsumptionByUnit(unitId: string) {
  const supabase = createServerClient()

  try {
    const { data: fuelRecords, error } = await supabase
      .from("fuel_consumption")
      .select("*")
      .eq("unit_id", unitId)
      .order("period_start", { ascending: false })

    if (error) throw new Error(`Error fetching fuel consumption by unit: ${error.message}`)
    return { success: true, data: (fuelRecords ?? []) as FuelConsumption[] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as FuelConsumption[] }
  }
}

export type FuelSummary = {
  total_records: number
  total_liters: number
  total_cost: number
  total_hours: number
  average_efficiency: number
  best_efficiency: number
  worst_efficiency: number
}

export async function getFuelConsumptionSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("fuel_consumption").select("liters_consumed, total_cost, hours_operated, efficiency_lph")

    if (filters?.date_from) query = query.gte("period_start", filters.date_from)
    if (filters?.date_to) query = query.lte("period_end", filters.date_to)

    const { data: records, error } = await query
    if (error) throw new Error(`Error fetching fuel consumption summary: ${error.message}`)

    type Lite = Pick<
      FuelConsumption,
      "liters_consumed" | "total_cost" | "hours_operated" | "efficiency_lph"
    >

    const arr = (records ?? []) as Lite[]
    const summary: FuelSummary = {
      total_records: arr.length,
      total_liters: arr.reduce((sum, r) => sum + (r.liters_consumed ?? 0), 0),
      total_cost: arr.reduce((sum, r) => sum + (r.total_cost ?? 0), 0),
      total_hours: arr.reduce((sum, r) => sum + (r.hours_operated ?? 0), 0),
      average_efficiency: arr.length ? arr.reduce((sum, r) => sum + (r.efficiency_lph ?? 0), 0) / arr.length : 0,
      best_efficiency: arr.length ? Math.min(...arr.map((r) => r.efficiency_lph ?? Number.POSITIVE_INFINITY)) : 0,
      worst_efficiency: arr.length ? Math.max(...arr.map((r) => r.efficiency_lph ?? 0)) : 0,
    }

    return { success: true, data: summary }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export type FuelTrendRow = {
  month: string
  liters: number
  cost: number
  efficiency: number
  records: number
}

export async function getFuelTrends(unitId?: string, months = 12) {
  const supabase = createServerClient()

  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    let query = supabase
      .from("fuel_consumption")
      .select("period_start, liters_consumed, total_cost, efficiency_lph, unit_id")
      .gte("period_start", startDate.toISOString().split("T")[0])
      .order("period_start", { ascending: true })

    if (unitId) query = query.eq("unit_id", unitId)

    const { data: records, error } = await query
    if (error) throw new Error(`Error fetching fuel trends: ${error.message}`)

    type Lite = Pick<FuelConsumption, "period_start" | "liters_consumed" | "total_cost" | "efficiency_lph">

    const monthlyData = (records as Lite[] | null)?.reduce<Record<string, {
      month: string
      liters: number
      cost: number
      efficiency: number[]
      records: number
    }>>((acc, record) => {
      const month = record.period_start.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, liters: 0, cost: 0, efficiency: [], records: 0 }
      }
      acc[month].liters += record.liters_consumed ?? 0
      acc[month].cost += record.total_cost ?? 0
      acc[month].efficiency.push(record.efficiency_lph ?? 0)
      acc[month].records += 1
      return acc
    }, {})

    const trends: FuelTrendRow[] = Object.values(monthlyData ?? {}).map((data) => ({
      month: data.month,
      liters: data.liters,
      cost: data.cost,
      efficiency: data.efficiency.reduce((sum, eff) => sum + eff, 0) / (data.efficiency.length || 1),
      records: data.records,
    }))

    return { success: true, data: trends }
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
  total_cost: number
  efficiency_readings: number[]
  records: number
  average_efficiency: number
  best_efficiency: number
  worst_efficiency: number
}

export async function getEfficiencyComparison() {
  const supabase = createServerClient()

  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const { data: records, error } = await supabase
      .from("fuel_consumption")
      .select(
        `
        unit_id,
        efficiency_lph,
        liters_consumed,
        total_cost,
        unit:units(unit_number, brand, model, fuel_type)
      `,
      )
      .gte("period_start", ninetyDaysAgo)

    if (error) throw new Error(`Error fetching efficiency comparison: ${error.message}`)

    type Row = {
      unit_id: string
      efficiency_lph: number | null
      liters_consumed: number | null
      total_cost: number | null
      unit: { unit_number?: string | null; brand?: string | null; model?: string | null; fuel_type?: string | null } | null
    }

    const unitStats = (records as Row[] | null)?.reduce<Record<string, EfficiencyComparisonRow>>((acc, record) => {
      const unitId = record.unit_id
      if (!acc[unitId]) {
        acc[unitId] = {
          unit_id: unitId,
          unit_number: record.unit?.unit_number ?? "",
          brand: record.unit?.brand ?? "",
          model: record.unit?.model ?? "",
          fuel_type: record.unit?.fuel_type ?? "",
          total_liters: 0,
          total_cost: 0,
          efficiency_readings: [],
          records: 0,
          average_efficiency: 0,
          best_efficiency: 0,
          worst_efficiency: 0,
        }
      }
      acc[unitId].total_liters += record.liters_consumed ?? 0
      acc[unitId].total_cost += record.total_cost ?? 0
      acc[unitId].efficiency_readings.push(record.efficiency_lph ?? 0)
      acc[unitId].records += 1
      return acc
    }, {})

    const comparison: EfficiencyComparisonRow[] = Object.values(unitStats ?? {}).map((unit) => {
      const avg = unit.efficiency_readings.length
        ? unit.efficiency_readings.reduce((sum, eff) => sum + eff, 0) / unit.efficiency_readings.length
        : 0
      const best = unit.efficiency_readings.length ? Math.min(...unit.efficiency_readings) : 0
      const worst = unit.efficiency_readings.length ? Math.max(...unit.efficiency_readings) : 0
      return { ...unit, average_efficiency: avg, best_efficiency: best, worst_efficiency: worst }
    })

    return { success: true, data: comparison }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as EfficiencyComparisonRow[] }
  }
}

export type FuelAlert = {
  type: "efficiency" | "cost"
  severity: "high" | "medium"
  unit_id: string
  unit_number: string
  message: string
  value: number
}

export async function getFuelAlerts() {
  const supabase = createServerClient()

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const { data: recentRecords, error } = await supabase
      .from("fuel_consumption")
      .select(
        `
        *,
        unit:units(unit_number, brand, model)
      `,
      )
      .gte("period_start", thirtyDaysAgo)

    if (error) throw new Error(`Error fetching fuel alerts: ${error.message}`)

    type Row = FuelConsumption & { unit?: { unit_number?: string | null } }

    const unitEfficiency = (recentRecords as Row[] | null)?.reduce<Record<
      string,
      { unit?: Row["unit"]; efficiencies: number[]; costs: number[] }
    >>((acc, record) => {
      const unitId = record.unit_id
      if (!acc[unitId]) {
        acc[unitId] = { unit: record.unit, efficiencies: [], costs: [] }
      }
      acc[unitId].efficiencies.push(record.efficiency_lph ?? 0)
      acc[unitId].costs.push(record.total_cost ?? 0)
      return acc
    }, {})

    const alerts: FuelAlert[] = []

    Object.entries(unitEfficiency ?? {}).forEach(([unitId, data]) => {
      const avgEfficiency =
        data.efficiencies.reduce((sum, eff) => sum + eff, 0) / (data.efficiencies.length || 1)
      const avgCost = data.costs.reduce((sum, c) => sum + c, 0) / (data.costs.length || 1)

      if (avgEfficiency > 1.5) {
        alerts.push({
          type: "efficiency",
          severity: avgEfficiency > 2.0 ? "high" : "medium",
          unit_id: unitId,
          unit_number: data.unit?.unit_number ?? "",
          message: `Eficiencia baja: ${avgEfficiency.toFixed(2)} L/h`,
          value: avgEfficiency,
        })
      }

      if (avgCost > 200) {
        alerts.push({
          type: "cost",
          severity: avgCost > 400 ? "high" : "medium",
          unit_id: unitId,
          unit_number: data.unit?.unit_number ?? "",
          message: `Costo alto: $${avgCost.toFixed(2)} USD`,
          value: avgCost,
        })
      }
    })

    return { success: true, data: alerts }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as FuelAlert[] }
  }
}

async function updateUnitHoursFromFuel(unitId: string, newHours: number) {
  const supabase = createServerClient()
  try {
    const { data: unit } = await supabase.from("units").select("current_hours").eq("id", unitId).single()
    if (unit && newHours > (unit.current_hours as number)) {
      await supabase
        .from("units")
        .update({
          current_hours: newHours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", unitId)
    }
  } catch {
    // log opcional
  }
}

export async function getMonthlyCosts(year?: number) {
  const supabase = createServerClient()

  try {
    const currentYear = year || new Date().getFullYear()
    const { data: records, error } = await supabase
      .from("fuel_consumption")
      .select("period_start, total_cost")
      .gte("period_start", `${currentYear}-01-01`)
      .lte("period_start", `${currentYear}-12-31`)

    if (error) throw new Error(`Error fetching monthly fuel costs: ${error.message}`)

    const monthlyCosts: { month: string; cost: number }[] = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(currentYear, i).toLocaleString("es", { month: "short" }),
      cost: 0,
    }))

    ;(records as { period_start: string; total_cost: number | null }[] | null)?.forEach((record) => {
      const month = new Date(record.period_start).getMonth()
      monthlyCosts[month].cost += record.total_cost ?? 0
    })

    return { success: true, data: monthlyCosts }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as { month: string; cost: number }[] }
  }
}
