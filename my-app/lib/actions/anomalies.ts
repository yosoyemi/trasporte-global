// my-app/lib/actions/anomalies.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Anomaly = {
  id: string
  unit_id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in_progress" | "resolved" | "closed"
  category: "mechanical" | "electrical" | "hydraulic" | "operational" | "safety" | "other"
  reported_by: string
  assigned_to: string | null
  reported_date: string
  resolved_date: string | null
  estimated_cost: number
  actual_cost: number | null
  downtime_hours: number
  priority: "low" | "medium" | "high" | "urgent"
  resolution_notes: string | null
  preventive_actions: string | null
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    status: string
  }
}

export type CreateAnomalyData = {
  unit_id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  category: "mechanical" | "electrical" | "hydraulic" | "operational" | "safety" | "other"
  reported_by: string
  reported_date: string
  estimated_cost: number
  downtime_hours: number
  priority: "low" | "medium" | "high" | "urgent"
  assigned_to?: string
}

export type UpdateAnomalyData = Partial<CreateAnomalyData> & {
  id: string
  status?: "open" | "in_progress" | "resolved" | "closed"
  actual_cost?: number
  resolved_date?: string
  resolution_notes?: string
  preventive_actions?: string
}

export async function createAnomaly(data: CreateAnomalyData) {
  const supabase = createServerClient()

  try {
    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .insert([
        {
          ...data,
          status: "open",
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Error creating anomaly: ${error.message}`)
    }

    if (data.severity === "critical" || data.severity === "high") {
      await updateUnitStatusForAnomaly(data.unit_id, "maintenance")
    }

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: anomaly as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function updateAnomaly(data: UpdateAnomalyData) {
  const supabase = createServerClient()

  try {
    const { id, ...updateData } = data
    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error updating anomaly: ${error.message}`)
    }

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: anomaly as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function resolveAnomaly(
  id: string,
  data: {
    actual_cost: number
    resolution_notes: string
    preventive_actions?: string
    assigned_to?: string
  },
) {
  const supabase = createServerClient()

  try {
    const { data: currentAnomaly, error: fetchError } = await supabase
      .from("anomaly_reports")
      .select("unit_id, severity")
      .eq("id", id)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching anomaly: ${fetchError.message}`)
    }

    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .update({
        status: "resolved",
        resolved_date: new Date().toISOString(),
        actual_cost: data.actual_cost,
        resolution_notes: data.resolution_notes,
        preventive_actions: data.preventive_actions,
        assigned_to: data.assigned_to,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error resolving anomaly: ${error.message}`)
    }

    await checkUnitStatusAfterResolution((currentAnomaly as { unit_id: string }).unit_id)

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: anomaly as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function closeAnomaly(id: string, notes?: string) {
  const supabase = createServerClient()

  try {
    const updateData: Partial<Pick<Anomaly, "status" | "updated_at" | "resolution_notes">> = {
      status: "closed",
      updated_at: new Date().toISOString(),
    }
    if (notes) updateData.resolution_notes = notes

    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Error closing anomaly: ${error.message}`)

    revalidatePath("/anomalies")
    revalidatePath("/")
    return { success: true, data: anomaly as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function deleteAnomaly(id: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("anomaly_reports").delete().eq("id", id)
    if (error) throw new Error(`Error deleting anomaly: ${error.message}`)

    revalidatePath("/anomalies")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getAnomalies(filters?: {
  unit_id?: string
  status?: string
  severity?: string
  category?: string
  priority?: string
  assigned_to?: string
  date_from?: string
  date_to?: string
}) {
  const supabase = createServerClient()

  try {
    let query = supabase
      .from("anomaly_reports")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, status)
      `,
      )
      .order("reported_date", { ascending: false })

    if (filters?.unit_id) query = query.eq("unit_id", filters.unit_id)
    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status)
    if (filters?.severity && filters.severity !== "all") query = query.eq("severity", filters.severity)
    if (filters?.category && filters.category !== "all") query = query.eq("category", filters.category)
    if (filters?.priority && filters.priority !== "all") query = query.eq("priority", filters.priority)
    if (filters?.assigned_to && filters.assigned_to !== "all") query = query.eq("assigned_to", filters.assigned_to)
    if (filters?.date_from) query = query.gte("reported_date", filters.date_from)
    if (filters?.date_to) query = query.lte("reported_date", filters.date_to)

    const { data: anomalies, error } = await query

    if (error) throw new Error(`Error fetching anomalies: ${error.message}`)

    return { success: true, data: (anomalies ?? []) as Anomaly[] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as Anomaly[] }
  }
}

export async function getAnomalyById(id: string) {
  const supabase = createServerClient()

  try {
    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, status, current_hours)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw new Error(`Error fetching anomaly: ${error.message}`)

    return { success: true, data: anomaly as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getAnomaliesByUnit(unitId: string) {
  const supabase = createServerClient()

  try {
    const { data: anomalies, error } = await supabase
      .from("anomaly_reports")
      .select("*")
      .eq("unit_id", unitId)
      .order("reported_date", { ascending: false })

    if (error) throw new Error(`Error fetching anomalies by unit: ${error.message}`)

    return { success: true, data: (anomalies ?? []) as Anomaly[] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as Anomaly[] }
  }
}

export type AnomaliesSummary = {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  low_severity: number
  medium_severity: number
  high_severity: number
  critical_severity: number
  mechanical: number
  electrical: number
  hydraulic: number
  operational: number
  safety: number
  total_estimated_cost: number
  total_actual_cost: number
  total_downtime: number
  urgent_priority: number
  high_priority: number
}

export async function getAnomaliesSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase
      .from("anomaly_reports")
      .select("status, severity, category, priority, estimated_cost, actual_cost, downtime_hours")

    if (filters?.date_from) query = query.gte("reported_date", filters.date_from)
    if (filters?.date_to) query = query.lte("reported_date", filters.date_to)

    const { data: anomalies, error } = await query
    if (error) throw new Error(`Error fetching anomalies summary: ${error.message}`)

    type Lite = {
      status: Anomaly["status"]
      severity: Anomaly["severity"]
      category: Anomaly["category"] | null
      priority: Anomaly["priority"] | null
      estimated_cost: number | null
      actual_cost: number | null
      downtime_hours: number | null
    }

    const list = (anomalies ?? []) as Lite[]

    const summary: AnomaliesSummary = {
      total: list.length,
      open: list.filter((a) => a.status === "open").length,
      in_progress: list.filter((a) => a.status === "in_progress").length,
      resolved: list.filter((a) => a.status === "resolved").length,
      closed: list.filter((a) => a.status === "closed").length,
      low_severity: list.filter((a) => a.severity === "low").length,
      medium_severity: list.filter((a) => a.severity === "medium").length,
      high_severity: list.filter((a) => a.severity === "high").length,
      critical_severity: list.filter((a) => a.severity === "critical").length,
      mechanical: list.filter((a) => a.category === "mechanical").length,
      electrical: list.filter((a) => a.category === "electrical").length,
      hydraulic: list.filter((a) => a.category === "hydraulic").length,
      operational: list.filter((a) => a.category === "operational").length,
      safety: list.filter((a) => a.category === "safety").length,
      total_estimated_cost: list.reduce((sum, a) => sum + (a.estimated_cost ?? 0), 0),
      total_actual_cost: list.reduce((sum, a) => sum + (a.actual_cost ?? 0), 0),
      total_downtime: list.reduce((sum, a) => sum + (a.downtime_hours ?? 0), 0),
      urgent_priority: list.filter((a) => a.priority === "urgent").length,
      high_priority: list.filter((a) => a.priority === "high").length,
    }

    return { success: true, data: summary }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getAssignees() {
  const supabase = createServerClient()

  try {
    const { data: anomalies, error } = await supabase
      .from("anomaly_reports")
      .select("assigned_to")
      .not("assigned_to", "is", null)

    if (error) throw new Error(`Error fetching assignees: ${error.message}`)

    const assignees = [...new Set((anomalies ?? []).map((a) => a.assigned_to).filter(Boolean) as string[])]
    return { success: true, data: assignees }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as string[] }
  }
}

export async function getReporters() {
  const supabase = createServerClient()

  try {
    const { data: anomalies, error } = await supabase.from("anomaly_reports").select("reported_by")
    if (error) throw new Error(`Error fetching reporters: ${error.message}`)

    const reporters = [...new Set((anomalies ?? []).map((a) => a.reported_by).filter(Boolean) as string[])]
    return { success: true, data: reporters }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as string[] }
  }
}

export type CategoryAggregate = {
  category: NonNullable<Anomaly["category"]> | "other"
  total: number
  low: number
  medium: number
  high: number
  critical: number
  estimated_cost: number
  actual_cost: number
}

export async function getAnomaliesByCategory(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("anomaly_reports").select("category, severity, estimated_cost, actual_cost")

    if (filters?.date_from) query = query.gte("reported_date", filters.date_from)
    if (filters?.date_to) query = query.lte("reported_date", filters.date_to)

    const { data: anomalies, error } = await query
    if (error) throw new Error(`Error fetching anomalies by category: ${error.message}`)

    type Row = {
      category: Anomaly["category"] | null
      severity: Anomaly["severity"]
      estimated_cost: number | null
      actual_cost: number | null
    }

    const categoryStats = (anomalies as Row[] | null)?.reduce<Record<string, CategoryAggregate>>((acc, anomaly) => {
      const cat = (anomaly.category ?? "other") as CategoryAggregate["category"]
      if (!acc[cat]) {
        acc[cat] = {
          category: cat,
          total: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
          estimated_cost: 0,
          actual_cost: 0,
        }
      }
      acc[cat].total += 1
      acc[cat][anomaly.severity] += 1
      acc[cat].estimated_cost += anomaly.estimated_cost ?? 0
      acc[cat].actual_cost += anomaly.actual_cost ?? 0
      return acc
    }, {} as Record<string, CategoryAggregate>)

    return { success: true, data: Object.values(categoryStats ?? {}) }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as CategoryAggregate[] }
  }
}

async function updateUnitStatusForAnomaly(unitId: string, status: "active" | "maintenance" | "inactive") {
  const supabase = createServerClient()
  try {
    await supabase
      .from("units")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", unitId)
  } catch {
    // log opcional
  }
}

async function checkUnitStatusAfterResolution(unitId: string) {
  const supabase = createServerClient()
  try {
    const { data: openAnomalies, error } = await supabase
      .from("anomaly_reports")
      .select("severity")
      .eq("unit_id", unitId)
      .in("status", ["open", "in_progress"])
      .in("severity", ["critical", "high"])

    if (error) return

    if (!openAnomalies || openAnomalies.length === 0) {
      await updateUnitStatusForAnomaly(unitId, "active")
    }
  } catch {
    // log opcional
  }
}

export async function assignAnomaly(id: string, assignedTo: string) {
  const supabase = createServerClient()

  try {
    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .update({
        assigned_to: assignedTo,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Error assigning anomaly: ${error.message}`)

    revalidatePath("/anomalies")
    revalidatePath("/")
    return { success: true, data: anomaly as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}
