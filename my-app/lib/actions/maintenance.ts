"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type MaintenanceSchedule = {
  id: string
  unit_id: string
  maintenance_type: "preventive" | "corrective"
  interval_hours: number
  last_service_hours: number
  next_service_hours: number
  status: "pending" | "overdue" | "completed"
  description: string
  estimated_cost: number
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    current_hours: number
  }
}

export type CreateMaintenanceData = {
  unit_id: string
  maintenance_type: "preventive" | "corrective"
  interval_hours: number
  last_service_hours: number
  next_service_hours: number
  description: string
  estimated_cost: number
}

export type UpdateMaintenanceData = Partial<CreateMaintenanceData> & {
  id: string
  status?: "pending" | "overdue" | "completed"
}

// Standard maintenance intervals in hours
export const MAINTENANCE_INTERVALS = [250, 500, 750, 1000, 2000, 3000]

export async function createMaintenanceSchedule(data: CreateMaintenanceData) {
  const supabase = createServerClient()

  try {
    // Get current unit hours
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("current_hours")
      .eq("id", data.unit_id)
      .single()

    if (unitError) {
      throw new Error(`Error fetching unit: ${unitError.message}`)
    }

    // Determine status based on current hours vs next service hours
    const status = unit.current_hours >= data.next_service_hours ? "overdue" : "pending"

    const { data: maintenance, error } = await supabase
      .from("maintenance_schedules")
      .insert([
        {
          ...data,
          status,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating maintenance schedule:", error)
      throw new Error(`Error creating maintenance schedule: ${error.message}`)
    }

    revalidatePath("/maintenance")
    revalidatePath("/")
    return { success: true, data: maintenance }
  } catch (error) {
    console.error("Error in createMaintenanceSchedule:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateMaintenanceSchedule(data: UpdateMaintenanceData) {
  const supabase = createServerClient()

  try {
    const { id, ...updateData } = data
    const { data: maintenance, error } = await supabase
      .from("maintenance_schedules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating maintenance schedule:", error)
      throw new Error(`Error updating maintenance schedule: ${error.message}`)
    }

    revalidatePath("/maintenance")
    revalidatePath("/")
    return { success: true, data: maintenance }
  } catch (error) {
    console.error("Error in updateMaintenanceSchedule:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function completeMaintenanceSchedule(
  id: string,
  data: {
    actual_cost: number
    technician: string
    notes?: string
  },
) {
  const supabase = createServerClient()

  try {
    // Get the maintenance schedule
    const { data: currentMaintenance, error: fetchError } = await supabase
      .from("maintenance_schedules")
      .select("unit_id, interval_hours, next_service_hours")
      .eq("id", id)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching maintenance: ${fetchError.message}`)
    }

    // Get current unit hours
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("current_hours")
      .eq("id", currentMaintenance.unit_id)
      .single()

    if (unitError) {
      throw new Error(`Error fetching unit: ${unitError.message}`)
    }

    // Mark maintenance as completed
    const { error: updateError } = await supabase
      .from("maintenance_schedules")
      .update({ status: "completed" })
      .eq("id", id)

    if (updateError) {
      throw new Error(`Error completing maintenance: ${updateError.message}`)
    }

    // Create service record
    const { error: serviceError } = await supabase.from("services").insert([
      {
        unit_id: currentMaintenance.unit_id,
        service_type: "preventive",
        service_date: new Date().toISOString().split("T")[0],
        hours_at_service: unit.current_hours,
        technician: data.technician,
        description: `Mantenimiento preventivo ${currentMaintenance.interval_hours}h completado`,
        total_cost: data.actual_cost,
        notes: data.notes,
        status: "completed",
      },
    ])

    if (serviceError) {
      console.error("Error creating service record:", serviceError)
    }

    // Create next maintenance schedule
    await createNextMaintenanceSchedule(
      currentMaintenance.unit_id,
      currentMaintenance.interval_hours,
      unit.current_hours,
    )

    revalidatePath("/maintenance")
    revalidatePath("/units")
    revalidatePath("/services")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error in completeMaintenanceSchedule:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function createNextMaintenanceSchedule(unitId: string, intervalHours: number, currentHours: number) {
  const supabase = createServerClient()

  try {
    // Get unit info
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("brand, model")
      .eq("id", unitId)
      .single()

    if (unitError) {
      console.error("Error fetching unit for next maintenance:", unitError)
      return
    }

    const nextServiceHours = currentHours + intervalHours
    const description = `Mantenimiento preventivo ${intervalHours}h - ${unit.brand} ${unit.model}`

    await supabase.from("maintenance_schedules").insert([
      {
        unit_id: unitId,
        maintenance_type: "preventive",
        interval_hours: intervalHours,
        last_service_hours: currentHours,
        next_service_hours: nextServiceHours,
        status: "pending",
        description,
        estimated_cost: getEstimatedCostByInterval(intervalHours),
      },
    ])
  } catch (error) {
    console.error("Error creating next maintenance schedule:", error)
  }
}

function getEstimatedCostByInterval(intervalHours: number): number {
  const costMap: Record<number, number> = {
    250: 150,
    500: 300,
    750: 200,
    1000: 500,
    2000: 800,
    3000: 1200,
  }
  return costMap[intervalHours] || 300
}

export async function getMaintenanceSchedules(filters?: {
  status?: string
  unit_id?: string
  maintenance_type?: string
  overdue_only?: boolean
}) {
  const supabase = createServerClient()

  try {
    let query = supabase
      .from("maintenance_schedules")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, current_hours)
      `,
      )
      .order("next_service_hours", { ascending: true })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.unit_id) {
      query = query.eq("unit_id", filters.unit_id)
    }

    if (filters?.maintenance_type && filters.maintenance_type !== "all") {
      query = query.eq("maintenance_type", filters.maintenance_type)
    }

    if (filters?.overdue_only) {
      query = query.eq("status", "overdue")
    }

    const { data: schedules, error } = await query

    if (error) {
      console.error("Error fetching maintenance schedules:", error)
      throw new Error(`Error fetching maintenance schedules: ${error.message}`)
    }

    return { success: true, data: schedules || [] }
  } catch (error) {
    console.error("Error in getMaintenanceSchedules:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getMaintenanceById(id: string) {
  const supabase = createServerClient()

  try {
    const { data: maintenance, error } = await supabase
      .from("maintenance_schedules")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, current_hours, status)
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching maintenance:", error)
      throw new Error(`Error fetching maintenance: ${error.message}`)
    }

    return { success: true, data: maintenance }
  } catch (error) {
    console.error("Error in getMaintenanceById:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function schedulePreventiveMaintenance(unitId: string, intervalHours: number) {
  const supabase = createServerClient()

  try {
    // Get unit current hours
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("current_hours, brand, model, unit_number")
      .eq("id", unitId)
      .single()

    if (unitError) {
      throw new Error(`Error fetching unit: ${unitError.message}`)
    }

    // Calculate next service hours
    const nextServiceHours = Math.ceil(unit.current_hours / intervalHours) * intervalHours + intervalHours
    const description = `Mantenimiento preventivo ${intervalHours}h - ${unit.brand} ${unit.model}`

    const maintenanceData: CreateMaintenanceData = {
      unit_id: unitId,
      maintenance_type: "preventive",
      interval_hours: intervalHours,
      last_service_hours: unit.current_hours,
      next_service_hours: nextServiceHours,
      description,
      estimated_cost: getEstimatedCostByInterval(intervalHours),
    }

    return await createMaintenanceSchedule(maintenanceData)
  } catch (error) {
    console.error("Error in schedulePreventiveMaintenance:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getMaintenanceSummary() {
  const supabase = createServerClient()

  try {
    const { data: schedules, error } = await supabase.from("maintenance_schedules").select("status, maintenance_type")

    if (error) {
      throw new Error(`Error fetching maintenance summary: ${error.message}`)
    }

    const summary = {
      total: schedules?.length || 0,
      pending: schedules?.filter((s) => s.status === "pending").length || 0,
      overdue: schedules?.filter((s) => s.status === "overdue").length || 0,
      completed: schedules?.filter((s) => s.status === "completed").length || 0,
      preventive: schedules?.filter((s) => s.maintenance_type === "preventive").length || 0,
      corrective: schedules?.filter((s) => s.maintenance_type === "corrective").length || 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error in getMaintenanceSummary:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateMaintenanceStatuses() {
  const supabase = createServerClient()

  try {
    // Get all pending maintenances with unit hours
    const { data: pendingMaintenances, error } = await supabase
      .from("maintenance_schedules")
      .select(
        `
        id,
        next_service_hours,
        unit:units!inner(current_hours)
      `,
      )
      .eq("status", "pending")

    if (error) {
      throw new Error(`Error fetching pending maintenances: ${error.message}`)
    }

    // Update overdue maintenances
    const overdueIds = pendingMaintenances
      ?.filter((m) => m.unit && m.unit.current_hours >= m.next_service_hours)
      .map((m) => m.id)

    if (overdueIds && overdueIds.length > 0) {
      await supabase.from("maintenance_schedules").update({ status: "overdue" }).in("id", overdueIds)
    }

    revalidatePath("/maintenance")
    revalidatePath("/")
    return { success: true, updated: overdueIds?.length || 0 }
  } catch (error) {
    console.error("Error in updateMaintenanceStatuses:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
