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
      console.error("Error creating anomaly:", error)
      throw new Error(`Error creating anomaly: ${error.message}`)
    }

    // If anomaly is critical or high severity, update unit status to maintenance
    if (data.severity === "critical" || data.severity === "high") {
      await updateUnitStatusForAnomaly(data.unit_id, "maintenance")
    }

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: anomaly }
  } catch (error) {
    console.error("Error in createAnomaly:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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
      console.error("Error updating anomaly:", error)
      throw new Error(`Error updating anomaly: ${error.message}`)
    }

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: anomaly }
  } catch (error) {
    console.error("Error in updateAnomaly:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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
    // Get the anomaly to access unit_id
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

    // Check if unit can return to active status
    await checkUnitStatusAfterResolution(currentAnomaly.unit_id)

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: anomaly }
  } catch (error) {
    console.error("Error in resolveAnomaly:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function closeAnomaly(id: string, notes?: string) {
  const supabase = createServerClient()

  try {
    const updateData: any = {
      status: "closed",
      updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData.resolution_notes = notes
    }

    const { data: anomaly, error } = await supabase
      .from("anomaly_reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Error closing anomaly: ${error.message}`)
    }

    revalidatePath("/anomalies")
    revalidatePath("/")
    return { success: true, data: anomaly }
  } catch (error) {
    console.error("Error in closeAnomaly:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteAnomaly(id: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("anomaly_reports").delete().eq("id", id)

    if (error) {
      console.error("Error deleting anomaly:", error)
      throw new Error(`Error deleting anomaly: ${error.message}`)
    }

    revalidatePath("/anomalies")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteAnomaly:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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

    if (filters?.unit_id) {
      query = query.eq("unit_id", filters.unit_id)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.severity && filters.severity !== "all") {
      query = query.eq("severity", filters.severity)
    }

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (filters?.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority)
    }

    if (filters?.assigned_to && filters.assigned_to !== "all") {
      query = query.eq("assigned_to", filters.assigned_to)
    }

    if (filters?.date_from) {
      query = query.gte("reported_date", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("reported_date", filters.date_to)
    }

    const { data: anomalies, error } = await query

    if (error) {
      console.error("Error fetching anomalies:", error)
      throw new Error(`Error fetching anomalies: ${error.message}`)
    }

    return { success: true, data: anomalies || [] }
  } catch (error) {
    console.error("Error in getAnomalies:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
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

    if (error) {
      console.error("Error fetching anomaly:", error)
      throw new Error(`Error fetching anomaly: ${error.message}`)
    }

    return { success: true, data: anomaly }
  } catch (error) {
    console.error("Error in getAnomalyById:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
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

    if (error) {
      console.error("Error fetching anomalies by unit:", error)
      throw new Error(`Error fetching anomalies by unit: ${error.message}`)
    }

    return { success: true, data: anomalies || [] }
  } catch (error) {
    console.error("Error in getAnomaliesByUnit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getAnomaliesSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase
      .from("anomaly_reports")
      .select("status, severity, category, priority, estimated_cost, actual_cost, downtime_hours")

    if (filters?.date_from) {
      query = query.gte("reported_date", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("reported_date", filters.date_to)
    }

    const { data: anomalies, error } = await query

    if (error) {
      throw new Error(`Error fetching anomalies summary: ${error.message}`)
    }

    const summary = {
      total: anomalies?.length || 0,
      open: anomalies?.filter((a) => a.status === "open").length || 0,
      in_progress: anomalies?.filter((a) => a.status === "in_progress").length || 0,
      resolved: anomalies?.filter((a) => a.status === "resolved").length || 0,
      closed: anomalies?.filter((a) => a.status === "closed").length || 0,
      low_severity: anomalies?.filter((a) => a.severity === "low").length || 0,
      medium_severity: anomalies?.filter((a) => a.severity === "medium").length || 0,
      high_severity: anomalies?.filter((a) => a.severity === "high").length || 0,
      critical_severity: anomalies?.filter((a) => a.severity === "critical").length || 0,
      mechanical: anomalies?.filter((a) => a.category === "mechanical").length || 0,
      electrical: anomalies?.filter((a) => a.category === "electrical").length || 0,
      hydraulic: anomalies?.filter((a) => a.category === "hydraulic").length || 0,
      operational: anomalies?.filter((a) => a.category === "operational").length || 0,
      safety: anomalies?.filter((a) => a.category === "safety").length || 0,
      total_estimated_cost: anomalies?.reduce((sum, a) => sum + (a.estimated_cost || 0), 0) || 0,
      total_actual_cost: anomalies?.reduce((sum, a) => sum + (a.actual_cost || 0), 0) || 0,
      total_downtime: anomalies?.reduce((sum, a) => sum + (a.downtime_hours || 0), 0) || 0,
      urgent_priority: anomalies?.filter((a) => a.priority === "urgent").length || 0,
      high_priority: anomalies?.filter((a) => a.priority === "high").length || 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error in getAnomaliesSummary:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getAssignees() {
  const supabase = createServerClient()

  try {
    const { data: anomalies, error } = await supabase
      .from("anomaly_reports")
      .select("assigned_to")
      .not("assigned_to", "is", null)

    if (error) {
      throw new Error(`Error fetching assignees: ${error.message}`)
    }

    const assignees = [...new Set(anomalies?.map((a) => a.assigned_to).filter(Boolean))] || []

    return { success: true, data: assignees }
  } catch (error) {
    console.error("Error in getAssignees:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getReporters() {
  const supabase = createServerClient()

  try {
    const { data: anomalies, error } = await supabase.from("anomaly_reports").select("reported_by")

    if (error) {
      throw new Error(`Error fetching reporters: ${error.message}`)
    }

    const reporters = [...new Set(anomalies?.map((a) => a.reported_by).filter(Boolean))] || []

    return { success: true, data: reporters }
  } catch (error) {
    console.error("Error in getReporters:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getAnomaliesByCategory(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("anomaly_reports").select("category, severity, estimated_cost, actual_cost")

    if (filters?.date_from) {
      query = query.gte("reported_date", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("reported_date", filters.date_to)
    }

    const { data: anomalies, error } = await query

    if (error) {
      throw new Error(`Error fetching anomalies by category: ${error.message}`)
    }

    const categoryStats = anomalies?.reduce(
      (acc, anomaly) => {
        const category = anomaly.category || "other"
        if (!acc[category]) {
          acc[category] = {
            category,
            total: 0,
            low: 0,
            medium: 0,
            high: 0,
            critical: 0,
            estimated_cost: 0,
            actual_cost: 0,
          }
        }
        acc[category].total++
        acc[category][anomaly.severity as keyof (typeof acc)[typeof category]]++
        acc[category].estimated_cost += anomaly.estimated_cost || 0
        acc[category].actual_cost += anomaly.actual_cost || 0
        return acc
      },
      {} as Record<string, any>,
    )

    return { success: true, data: Object.values(categoryStats || {}) }
  } catch (error) {
    console.error("Error in getAnomaliesByCategory:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
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
  } catch (error) {
    console.error("Error updating unit status for anomaly:", error)
  }
}

async function checkUnitStatusAfterResolution(unitId: string) {
  const supabase = createServerClient()

  try {
    // Check if there are any open critical or high severity anomalies for this unit
    const { data: openAnomalies, error } = await supabase
      .from("anomaly_reports")
      .select("severity")
      .eq("unit_id", unitId)
      .in("status", ["open", "in_progress"])
      .in("severity", ["critical", "high"])

    if (error) {
      console.error("Error checking unit status:", error)
      return
    }

    // If no critical/high anomalies, unit can return to active
    if (!openAnomalies || openAnomalies.length === 0) {
      await updateUnitStatusForAnomaly(unitId, "active")
    }
  } catch (error) {
    console.error("Error in checkUnitStatusAfterResolution:", error)
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

    if (error) {
      throw new Error(`Error assigning anomaly: ${error.message}`)
    }

    revalidatePath("/anomalies")
    revalidatePath("/")
    return { success: true, data: anomaly }
  } catch (error) {
    console.error("Error in assignAnomaly:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
