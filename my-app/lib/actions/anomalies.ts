// my-app/lib/actions/anomalies.ts
"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Anomaly = {
  id: string
  unit_id: string | null
  report_date: string
  reported_by: string | null
  anomaly_type: string | null
  severity: "low" | "medium" | "high" | "critical" | (string & {})
  description: string
  immediate_action: string | null
  estimated_repair_cost: number | null
  status: "open" | "in_progress" | "resolved" | "closed" | (string & {})
  resolution_date: string | null
  resolution_notes: string | null
  actual_repair_cost: number | null
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    status: string
  } | null
}

export type CreateAnomalyData = {
  unit_id: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  reported_by: string
  anomaly_type?: string // mechanical | electrical | hydraulic | operational | safety | other
  estimated_repair_cost?: number
  report_date?: string // default hoy (YYYY-MM-DD)
}

export type UpdateAnomalyData = Partial<CreateAnomalyData> & {
  id: string
  status?: "open" | "in_progress" | "resolved" | "closed"
  resolution_notes?: string
  actual_repair_cost?: number
  resolution_date?: string
}

export async function createAnomaly(data: CreateAnomalyData) {
  const supabase = createServerClient()
  try {
    const payload = {
      unit_id: data.unit_id,
      description: data.description,
      severity: data.severity,
      reported_by: data.reported_by,
      anomaly_type: data.anomaly_type ?? null,
      estimated_repair_cost: data.estimated_repair_cost ?? null,
      report_date: data.report_date ?? new Date().toISOString().slice(0, 10),
      status: "open" as const,
    }

    const { data: row, error } = await supabase
      .from("anomaly_reports")
      .insert([payload])
      .select(
        `
        *,
        unit:units(unit_number,brand,model,status)
      `
      )
      .single()

    if (error) throw new Error(error.message)

    // Si es crítica/alta, marcamos unidad en mantenimiento
    if (data.severity === "critical" || data.severity === "high") {
      await supabase
        .from("units")
        .update({ status: "maintenance", updated_at: new Date().toISOString() })
        .eq("id", data.unit_id)
    }

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/reports")
    return { success: true, data: row as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function updateAnomaly(data: UpdateAnomalyData) {
  const supabase = createServerClient()
  try {
    const { id, ...rest } = data
    const { data: row, error } = await supabase
      .from("anomaly_reports")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(
        `
        *,
        unit:units(unit_number,brand,model,status)
      `
      )
      .single()

    if (error) throw new Error(error.message)

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/reports")
    return { success: true, data: row as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function resolveAnomaly(
  id: string,
  payload: { actual_repair_cost?: number; resolution_notes?: string; resolution_date?: string }
) {
  const supabase = createServerClient()
  try {
    // Saber unidad de la anomalía
    const { data: curr, error: fe } = await supabase
      .from("anomaly_reports")
      .select("unit_id")
      .eq("id", id)
      .single()
    if (fe) throw new Error(fe.message)

    const { data: row, error } = await supabase
      .from("anomaly_reports")
      .update({
        status: "resolved",
        resolution_date: payload.resolution_date ?? new Date().toISOString().slice(0, 10),
        actual_repair_cost: payload.actual_repair_cost ?? null,
        resolution_notes: payload.resolution_notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        unit:units(unit_number,brand,model,status)
      `
      )
      .single()
    if (error) throw new Error(error.message)

    // Si no quedan críticas/altas abiertas/en proceso para esa unidad => volver a activo
    if (curr?.unit_id) {
      const { data: remaining, error: re } = await supabase
        .from("anomaly_reports")
        .select("id")
        .eq("unit_id", curr.unit_id)
        .in("status", ["open", "in_progress"])
        .in("severity", ["high", "critical"])
      if (!re && (remaining?.length ?? 0) === 0) {
        await supabase.from("units").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", curr.unit_id)
      }
    }

    revalidatePath("/anomalies")
    revalidatePath("/units")
    revalidatePath("/reports")
    return { success: true, data: row as Anomaly }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function deleteAnomaly(id: string) {
  const supabase = createServerClient()
  try {
    const { error } = await supabase.from("anomaly_reports").delete().eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/anomalies")
    revalidatePath("/reports")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getAnomalies(filters?: {
  search?: string
  unit_id?: string
  status?: string
  severity?: string
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
        unit:units(unit_number,brand,model,status)
      `
      )
      .order("report_date", { ascending: false })

    if (filters?.unit_id && filters.unit_id !== "all") query = query.eq("unit_id", filters.unit_id)
    if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status)
    if (filters?.severity && filters.severity !== "all") query = query.eq("severity", filters.severity)
    if (filters?.date_from) query = query.gte("report_date", filters.date_from)
    if (filters?.date_to) query = query.lte("report_date", filters.date_to)
    if (filters?.search) {
      const s = filters.search
      query = query.or(`description.ilike.%${s}%,reported_by.ilike.%${s}%`)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return { success: true, data: (data ?? []) as Anomaly[] }
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
  high_or_critical: number
  total_estimated: number
  total_actual: number
}

export async function getAnomaliesSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()
  try {
    let query = supabase
      .from("anomaly_reports")
      .select("status, severity, estimated_repair_cost, actual_repair_cost, report_date")

    if (filters?.date_from) query = query.gte("report_date", filters.date_from)
    if (filters?.date_to) query = query.lte("report_date", filters.date_to)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const list =
      (data as {
        status: Anomaly["status"]
        severity: Anomaly["severity"]
        estimated_repair_cost: number | null
        actual_repair_cost: number | null
      }[]) ?? []

    const summary: AnomaliesSummary = {
      total: list.length,
      open: list.filter((a) => a.status === "open").length,
      in_progress: list.filter((a) => a.status === "in_progress").length,
      resolved: list.filter((a) => a.status === "resolved").length,
      closed: list.filter((a) => a.status === "closed").length,
      high_or_critical: list.filter((a) => a.severity === "high" || a.severity === "critical").length,
      total_estimated: list.reduce((sum, a) => sum + (a.estimated_repair_cost ?? 0), 0),
      total_actual: list.reduce((sum, a) => sum + (a.actual_repair_cost ?? 0), 0),
    }

    return { success: true, data: summary }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" }
  }
}

export async function getUnitsForSelect() {
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase.from("units").select("id,unit_number").order("unit_number", { ascending: true })
    if (error) throw new Error(error.message)
    return { success: true, data: (data ?? []) as { id: string; unit_number: string }[] }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as { id: string; unit_number: string }[] }
  }
}

export async function getReporters() {
  const supabase = createServerClient()
  try {
    const { data, error } = await supabase.from("anomaly_reports").select("reported_by")
    if (error) throw new Error(error.message)
    const reporters = [...new Set((data ?? []).map((r) => r.reported_by).filter(Boolean))] as string[]
    return { success: true, data: reporters }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error", data: [] as string[] }
  }
}
