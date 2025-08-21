"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type MaintenanceSchedule = {
  id: string
  unit_id: string
  maintenance_type: "preventive" | "corrective"
  interval_hours: number
  last_service_hours: number | null
  next_service_hours: number
  status: "pending" | "overdue" | "completed"
  description: string | null
  estimated_cost: number | null
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    current_hours: number
  } | null
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

export async function createMaintenanceSchedule(data: CreateMaintenanceData) {
  const supabase = createServerClient()
  try {
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("current_hours")
      .eq("id", data.unit_id)
      .single()
    if (unitError) throw new Error(unitError.message || "Failed to fetch unit")

    const status: MaintenanceSchedule["status"] =
      (unit?.current_hours ?? 0) >= data.next_service_hours ? "overdue" : "pending"

    const { data: maintenance, error } = await supabase
      .from("maintenance_schedules")
      .insert([{ ...data, status }])
      .select()
      .single()

    if (error) throw new Error(error.message || "Failed to create maintenance schedule")

    revalidatePath("/maintenance")
    revalidatePath("/")
    return { success: true, data: maintenance as MaintenanceSchedule }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateMaintenanceSchedule(data: UpdateMaintenanceData) {
  const supabase = createServerClient()
  try {
    const { id, ...updateData } = data
    const { data: maintenance, error } = await supabase
      .from("maintenance_schedules")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (error) throw new Error(error.message || "Failed to update maintenance schedule")

    revalidatePath("/maintenance")
    revalidatePath("/")
    return { success: true, data: maintenance as MaintenanceSchedule }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function completeMaintenanceSchedule(
  id: string,
  data: { actual_cost: number; technician: string; notes?: string },
) {
  const supabase = createServerClient()
  try {
    // 1) Traer mantenimiento + unidad
    const { data: currentMaintenance, error: fetchError } = await supabase
      .from("maintenance_schedules")
      .select("unit_id, interval_hours, next_service_hours")
      .eq("id", id)
      .single()
    if (fetchError) throw new Error(fetchError.message || "Failed to fetch maintenance")

    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("current_hours, brand, model")
      .eq("id", currentMaintenance.unit_id)
      .single()
    if (unitError) throw new Error(unitError.message || "Failed to fetch unit")

    // 2) Marcar como completado
    const { error: updateError } = await supabase
      .from("maintenance_schedules")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", id)
    if (updateError) throw new Error(updateError.message || "Failed to complete maintenance")

    // 3) Registrar servicio (histórico)
    const description = `Mantenimiento preventivo ${currentMaintenance.interval_hours}h - ${unit.brand} ${unit.model}`
    const { error: serviceError } = await supabase.from("services").insert([
      {
        unit_id: currentMaintenance.unit_id,
        service_type: "preventive",
        service_date: new Date().toISOString().slice(0, 10),
        hours_at_service: unit.current_hours ?? 0,
        technician: data.technician,
        description,
        total_cost: data.actual_cost,
        notes: data.notes ?? null,
        status: "completed",
      },
    ])
    if (serviceError) console.error("Error creating service record:", serviceError)

    // 4) Crear siguiente mantenimiento
    await createNextMaintenanceSchedule(
      currentMaintenance.unit_id,
      currentMaintenance.interval_hours,
      unit.current_hours ?? 0,
    )

    revalidatePath("/maintenance")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function createNextMaintenanceSchedule(unitId: string, intervalHours: number, currentHours: number) {
  const supabase = createServerClient()
  try {
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("brand, model")
      .eq("id", unitId)
      .single()
    if (unitError) return

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
  } catch {
    // opcional: log
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

    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status)
    if (filters?.unit_id) query = query.eq("unit_id", filters.unit_id)
    if (filters?.maintenance_type && filters.maintenance_type !== "all")
      query = query.eq("maintenance_type", filters.maintenance_type)
    if (filters?.overdue_only) query = query.eq("status", "overdue")

    const { data: schedules, error } = await query
    if (error) throw new Error(error.message || "Failed to fetch maintenance schedules")

    return { success: true, data: (schedules ?? []) as MaintenanceSchedule[] }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] as MaintenanceSchedule[] }
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

    if (error) throw new Error(error.message || "Failed to fetch maintenance by id")

    return { success: true, data: maintenance as MaintenanceSchedule }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function schedulePreventiveMaintenance(unitId: string, intervalHours: number) {
  const supabase = createServerClient()
  try {
    const { data: unit, error: unitError } = await supabase
      .from("units")
      .select("current_hours, brand, model, unit_number")
      .eq("id", unitId)
      .single()
    if (unitError) throw new Error(unitError.message || "Failed to fetch unit")

    const nextMultiple = Math.ceil(((unit?.current_hours ?? 0) + 1) / intervalHours) * intervalHours
    const nextServiceHours = nextMultiple
    const description = `Mantenimiento preventivo ${intervalHours}h - ${unit.brand} ${unit.model}`

    const maintenanceData: CreateMaintenanceData = {
      unit_id: unitId,
      maintenance_type: "preventive",
      interval_hours: intervalHours,
      last_service_hours: unit?.current_hours ?? 0,
      next_service_hours: nextServiceHours,
      description,
      estimated_cost: getEstimatedCostByInterval(intervalHours),
    }

    return await createMaintenanceSchedule(maintenanceData)
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getMaintenanceSummary() {
  const supabase = createServerClient()
  try {
    const { data: schedules, error } = await supabase.from("maintenance_schedules").select("status, maintenance_type")
    if (error) throw new Error(error.message || "Failed to fetch maintenance summary")

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
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
