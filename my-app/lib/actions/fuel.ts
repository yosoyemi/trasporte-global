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
    // Calculate efficiency and total cost
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

    if (error) {
      console.error("Error creating fuel consumption:", error)
      throw new Error(`Error creating fuel consumption: ${error.message}`)
    }

    // Update unit's current hours if this is the most recent record
    await updateUnitHoursFromFuel(data.unit_id, data.odometer_end)

    revalidatePath("/fuel")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: fuelRecord }
  } catch (error) {
    console.error("Error in createFuelConsumption:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateFuelConsumption(data: UpdateFuelConsumptionData) {
  const supabase = createServerClient()

  try {
    const { id, ...updateData } = data

    // Recalculate efficiency and total cost if relevant fields changed
    let calculatedFields = {}
    if (updateData.liters_consumed !== undefined || updateData.hours_operated !== undefined) {
      // Get current record to fill missing values
      const { data: currentRecord } = await supabase.from("fuel_consumption").select("*").eq("id", id).single()

      const liters = updateData.liters_consumed ?? currentRecord?.liters_consumed ?? 0
      const hours = updateData.hours_operated ?? currentRecord?.hours_operated ?? 0
      const costPerLiter = updateData.cost_per_liter ?? currentRecord?.cost_per_liter ?? 0

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

    if (error) {
      console.error("Error updating fuel consumption:", error)
      throw new Error(`Error updating fuel consumption: ${error.message}`)
    }

    revalidatePath("/fuel")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: fuelRecord }
  } catch (error) {
    console.error("Error in updateFuelConsumption:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteFuelConsumption(id: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("fuel_consumption").delete().eq("id", id)

    if (error) {
      console.error("Error deleting fuel consumption:", error)
      throw new Error(`Error deleting fuel consumption: ${error.message}`)
    }

    revalidatePath("/fuel")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteFuelConsumption:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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

    if (filters?.unit_id) {
      query = query.eq("unit_id", filters.unit_id)
    }

    if (filters?.period_type && filters.period_type !== "all") {
      query = query.eq("period_type", filters.period_type)
    }

    if (filters?.date_from) {
      query = query.gte("period_start", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("period_end", filters.date_to)
    }

    const { data: fuelRecords, error } = await query

    if (error) {
      console.error("Error fetching fuel consumption:", error)
      throw new Error(`Error fetching fuel consumption: ${error.message}`)
    }

    return { success: true, data: fuelRecords || [] }
  } catch (error) {
    console.error("Error in getFuelConsumption:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
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

    if (error) {
      console.error("Error fetching fuel consumption:", error)
      throw new Error(`Error fetching fuel consumption: ${error.message}`)
    }

    return { success: true, data: fuelRecord }
  } catch (error) {
    console.error("Error in getFuelConsumptionById:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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

    if (error) {
      console.error("Error fetching fuel consumption by unit:", error)
      throw new Error(`Error fetching fuel consumption by unit: ${error.message}`)
    }

    return { success: true, data: fuelRecords || [] }
  } catch (error) {
    console.error("Error in getFuelConsumptionByUnit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getFuelConsumptionSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("fuel_consumption").select("liters_consumed, total_cost, hours_operated, efficiency_lph")

    if (filters?.date_from) {
      query = query.gte("period_start", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("period_end", filters.date_to)
    }

    const { data: records, error } = await query

    if (error) {
      throw new Error(`Error fetching fuel consumption summary: ${error.message}`)
    }

    const summary = {
      total_records: records?.length || 0,
      total_liters: records?.reduce((sum, r) => sum + (r.liters_consumed || 0), 0) || 0,
      total_cost: records?.reduce((sum, r) => sum + (r.total_cost || 0), 0) || 0,
      total_hours: records?.reduce((sum, r) => sum + (r.hours_operated || 0), 0) || 0,
      average_efficiency: records?.length
        ? records.reduce((sum, r) => sum + (r.efficiency_lph || 0), 0) / records.length
        : 0,
      best_efficiency: records?.length
        ? Math.min(...records.map((r) => r.efficiency_lph || Number.POSITIVE_INFINITY))
        : 0,
      worst_efficiency: records?.length ? Math.max(...records.map((r) => r.efficiency_lph || 0)) : 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error in getFuelConsumptionSummary:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
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

    if (unitId) {
      query = query.eq("unit_id", unitId)
    }

    const { data: records, error } = await query

    if (error) {
      throw new Error(`Error fetching fuel trends: ${error.message}`)
    }

    // Group by month
    const monthlyData = records?.reduce(
      (acc, record) => {
        const month = record.period_start.substring(0, 7) // YYYY-MM
        if (!acc[month]) {
          acc[month] = {
            month,
            liters: 0,
            cost: 0,
            efficiency: [],
            records: 0,
          }
        }
        acc[month].liters += record.liters_consumed || 0
        acc[month].cost += record.total_cost || 0
        acc[month].efficiency.push(record.efficiency_lph || 0)
        acc[month].records++
        return acc
      },
      {} as Record<string, any>,
    )

    const trends = Object.values(monthlyData || {}).map((data: any) => ({
      month: data.month,
      liters: data.liters,
      cost: data.cost,
      efficiency: data.efficiency.reduce((sum: number, eff: number) => sum + eff, 0) / data.efficiency.length,
      records: data.records,
    }))

    return { success: true, data: trends }
  } catch (error) {
    console.error("Error in getFuelTrends:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getEfficiencyComparison() {
  const supabase = createServerClient()

  try {
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
      .gte("period_start", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]) // Last 90 days

    if (error) {
      throw new Error(`Error fetching efficiency comparison: ${error.message}`)
    }

    const unitStats = records?.reduce(
      (acc, record) => {
        const unitId = record.unit_id
        if (!acc[unitId]) {
          acc[unitId] = {
            unit_id: unitId,
            unit_number: record.unit?.unit_number || "",
            brand: record.unit?.brand || "",
            model: record.unit?.model || "",
            fuel_type: record.unit?.fuel_type || "",
            total_liters: 0,
            total_cost: 0,
            efficiency_readings: [],
            records: 0,
          }
        }
        acc[unitId].total_liters += record.liters_consumed || 0
        acc[unitId].total_cost += record.total_cost || 0
        acc[unitId].efficiency_readings.push(record.efficiency_lph || 0)
        acc[unitId].records++
        return acc
      },
      {} as Record<string, any>,
    )

    const comparison = Object.values(unitStats || {}).map((unit: any) => ({
      ...unit,
      average_efficiency:
        unit.efficiency_readings.reduce((sum: number, eff: number) => sum + eff, 0) / unit.efficiency_readings.length,
      best_efficiency: Math.min(...unit.efficiency_readings),
      worst_efficiency: Math.max(...unit.efficiency_readings),
    }))

    return { success: true, data: comparison }
  } catch (error) {
    console.error("Error in getEfficiencyComparison:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getFuelAlerts() {
  const supabase = createServerClient()

  try {
    // Get recent fuel consumption data (last 30 days)
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

    if (error) {
      throw new Error(`Error fetching fuel alerts: ${error.message}`)
    }

    const alerts = []

    // Calculate average efficiency per unit
    const unitEfficiency = recentRecords?.reduce(
      (acc, record) => {
        const unitId = record.unit_id
        if (!acc[unitId]) {
          acc[unitId] = {
            unit: record.unit,
            efficiencies: [],
            costs: [],
          }
        }
        acc[unitId].efficiencies.push(record.efficiency_lph || 0)
        acc[unitId].costs.push(record.total_cost || 0)
        return acc
      },
      {} as Record<string, any>,
    )

    // Generate alerts for poor efficiency (above 1.5 L/h) or high costs
    Object.entries(unitEfficiency || {}).forEach(([unitId, data]: [string, any]) => {
      const avgEfficiency =
        data.efficiencies.reduce((sum: number, eff: number) => sum + eff, 0) / data.efficiencies.length
      const avgCost = data.costs.reduce((sum: number, cost: number) => sum + cost, 0) / data.costs.length

      if (avgEfficiency > 1.5) {
        alerts.push({
          type: "efficiency",
          severity: avgEfficiency > 2.0 ? "high" : "medium",
          unit_id: unitId,
          unit_number: data.unit?.unit_number || "",
          message: `Eficiencia baja: ${avgEfficiency.toFixed(2)} L/h`,
          value: avgEfficiency,
        })
      }

      if (avgCost > 200) {
        alerts.push({
          type: "cost",
          severity: avgCost > 400 ? "high" : "medium",
          unit_id: unitId,
          unit_number: data.unit?.unit_number || "",
          message: `Costo alto: $${avgCost.toFixed(2)} USD`,
          value: avgCost,
        })
      }
    })

    return { success: true, data: alerts }
  } catch (error) {
    console.error("Error in getFuelAlerts:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

async function updateUnitHoursFromFuel(unitId: string, newHours: number) {
  const supabase = createServerClient()

  try {
    // Only update if the new hours are higher than current hours
    const { data: unit } = await supabase.from("units").select("current_hours").eq("id", unitId).single()

    if (unit && newHours > unit.current_hours) {
      await supabase
        .from("units")
        .update({
          current_hours: newHours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", unitId)
    }
  } catch (error) {
    console.error("Error updating unit hours from fuel:", error)
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

    if (error) {
      throw new Error(`Error fetching monthly fuel costs: ${error.message}`)
    }

    const monthlyCosts = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(currentYear, i).toLocaleString("es", { month: "short" }),
      cost: 0,
    }))

    records?.forEach((record) => {
      const month = new Date(record.period_start).getMonth()
      monthlyCosts[month].cost += record.total_cost || 0
    })

    return { success: true, data: monthlyCosts }
  } catch (error) {
    console.error("Error in getMonthlyCosts:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}
