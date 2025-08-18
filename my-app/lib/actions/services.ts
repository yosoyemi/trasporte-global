"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Service = {
  id: string
  unit_id: string
  service_type: "corrective" | "preventive" | "inspection" | "repair"
  description: string
  severity: "low" | "medium" | "high" | "critical"
  total_cost: number
  labor_cost: number
  parts_cost: number
  labor_hours: number
  technician: string
  service_date: string
  downtime_hours: number
  parts_used: string | null
  notes: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  hours_at_service: number
  created_at: string
  updated_at: string
  unit?: {
    unit_number: string
    brand: string
    model: string
    current_hours: number
  }
}

export type CreateServiceData = {
  unit_id: string
  service_type: "corrective" | "preventive" | "inspection" | "repair"
  description: string
  severity: "low" | "medium" | "high" | "critical"
  total_cost: number
  labor_cost: number
  parts_cost: number
  labor_hours: number
  technician: string
  service_date: string
  downtime_hours: number
  hours_at_service: number
  parts_used?: string
  notes?: string
  status?: "pending" | "in_progress" | "completed" | "cancelled"
}

export type UpdateServiceData = Partial<CreateServiceData> & {
  id: string
}

export async function createService(data: CreateServiceData) {
  const supabase = createServerClient()

  try {
    const { data: service, error } = await supabase
      .from("services")
      .insert([
        {
          ...data,
          status: data.status || "completed",
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating service:", error)
      throw new Error(`Error creating service: ${error.message}`)
    }

    // If service is completed and has downtime, update unit status
    if (data.status === "completed" && data.downtime_hours > 0) {
      await updateUnitAfterService(data.unit_id, data.service_date)
    }

    revalidatePath("/services")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: service }
  } catch (error) {
    console.error("Error in createService:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateService(data: UpdateServiceData) {
  const supabase = createServerClient()

  try {
    const { id, ...updateData } = data
    const { data: service, error } = await supabase
      .from("services")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating service:", error)
      throw new Error(`Error updating service: ${error.message}`)
    }

    revalidatePath("/services")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: service }
  } catch (error) {
    console.error("Error in updateService:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteService(id: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("services").delete().eq("id", id)

    if (error) {
      console.error("Error deleting service:", error)
      throw new Error(`Error deleting service: ${error.message}`)
    }

    revalidatePath("/services")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteService:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getServices(filters?: {
  unit_id?: string
  service_type?: string
  severity?: string
  technician?: string
  status?: string
  date_from?: string
  date_to?: string
}) {
  const supabase = createServerClient()

  try {
    let query = supabase
      .from("services")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, current_hours)
      `,
      )
      .order("service_date", { ascending: false })

    if (filters?.unit_id) {
      query = query.eq("unit_id", filters.unit_id)
    }

    if (filters?.service_type && filters.service_type !== "all") {
      query = query.eq("service_type", filters.service_type)
    }

    if (filters?.severity && filters.severity !== "all") {
      query = query.eq("severity", filters.severity)
    }

    if (filters?.technician && filters.technician !== "all") {
      query = query.eq("technician", filters.technician)
    }

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.date_from) {
      query = query.gte("service_date", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("service_date", filters.date_to)
    }

    const { data: services, error } = await query

    if (error) {
      console.error("Error fetching services:", error)
      throw new Error(`Error fetching services: ${error.message}`)
    }

    return { success: true, data: services || [] }
  } catch (error) {
    console.error("Error in getServices:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getServiceById(id: string) {
  const supabase = createServerClient()

  try {
    const { data: service, error } = await supabase
      .from("services")
      .select(
        `
        *,
        unit:units(unit_number, brand, model, current_hours, status)
      `,
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching service:", error)
      throw new Error(`Error fetching service: ${error.message}`)
    }

    return { success: true, data: service }
  } catch (error) {
    console.error("Error in getServiceById:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getServicesByUnit(unitId: string) {
  const supabase = createServerClient()

  try {
    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("unit_id", unitId)
      .order("service_date", { ascending: false })

    if (error) {
      console.error("Error fetching services by unit:", error)
      throw new Error(`Error fetching services by unit: ${error.message}`)
    }

    return { success: true, data: services || [] }
  } catch (error) {
    console.error("Error in getServicesByUnit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getServicesSummary(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("services").select("service_type, severity, total_cost, labor_hours, downtime_hours")

    if (filters?.date_from) {
      query = query.gte("service_date", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("service_date", filters.date_to)
    }

    const { data: services, error } = await query

    if (error) {
      throw new Error(`Error fetching services summary: ${error.message}`)
    }

    const summary = {
      total: services?.length || 0,
      corrective: services?.filter((s) => s.service_type === "corrective").length || 0,
      preventive: services?.filter((s) => s.service_type === "preventive").length || 0,
      inspection: services?.filter((s) => s.service_type === "inspection").length || 0,
      repair: services?.filter((s) => s.service_type === "repair").length || 0,
      low_severity: services?.filter((s) => s.severity === "low").length || 0,
      medium_severity: services?.filter((s) => s.severity === "medium").length || 0,
      high_severity: services?.filter((s) => s.severity === "high").length || 0,
      critical_severity: services?.filter((s) => s.severity === "critical").length || 0,
      total_cost: services?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0,
      total_labor_hours: services?.reduce((sum, s) => sum + (s.labor_hours || 0), 0) || 0,
      total_downtime: services?.reduce((sum, s) => sum + (s.downtime_hours || 0), 0) || 0,
      average_cost: services?.length ? services.reduce((sum, s) => sum + (s.total_cost || 0), 0) / services.length : 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error in getServicesSummary:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getTechnicians() {
  const supabase = createServerClient()

  try {
    const { data: services, error } = await supabase.from("services").select("technician").not("technician", "is", null)

    if (error) {
      throw new Error(`Error fetching technicians: ${error.message}`)
    }

    const technicians = [...new Set(services?.map((s) => s.technician).filter(Boolean))] || []

    return { success: true, data: technicians }
  } catch (error) {
    console.error("Error in getTechnicians:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getServicesByTechnician(filters?: { date_from?: string; date_to?: string }) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("services").select("technician, total_cost, labor_hours, service_type")

    if (filters?.date_from) {
      query = query.gte("service_date", filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte("service_date", filters.date_to)
    }

    const { data: services, error } = await query

    if (error) {
      throw new Error(`Error fetching services by technician: ${error.message}`)
    }

    const technicianStats = services?.reduce(
      (acc, service) => {
        const tech = service.technician || "Sin asignar"
        if (!acc[tech]) {
          acc[tech] = {
            name: tech,
            total_services: 0,
            total_cost: 0,
            total_hours: 0,
            corrective: 0,
            preventive: 0,
          }
        }
        acc[tech].total_services++
        acc[tech].total_cost += service.total_cost || 0
        acc[tech].total_hours += service.labor_hours || 0
        if (service.service_type === "corrective") acc[tech].corrective++
        if (service.service_type === "preventive") acc[tech].preventive++
        return acc
      },
      {} as Record<string, any>,
    )

    return { success: true, data: Object.values(technicianStats || {}) }
  } catch (error) {
    console.error("Error in getServicesByTechnician:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getMonthlyCosts(year?: number) {
  const supabase = createServerClient()

  try {
    const currentYear = year || new Date().getFullYear()
    const { data: services, error } = await supabase
      .from("services")
      .select("service_date, total_cost")
      .gte("service_date", `${currentYear}-01-01`)
      .lte("service_date", `${currentYear}-12-31`)

    if (error) {
      throw new Error(`Error fetching monthly costs: ${error.message}`)
    }

    const monthlyCosts = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(currentYear, i).toLocaleString("es", { month: "short" }),
      cost: 0,
    }))

    services?.forEach((service) => {
      const month = new Date(service.service_date).getMonth()
      monthlyCosts[month].cost += service.total_cost || 0
    })

    return { success: true, data: monthlyCosts }
  } catch (error) {
    console.error("Error in getMonthlyCosts:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

async function updateUnitAfterService(unitId: string, serviceDate: string) {
  const supabase = createServerClient()

  try {
    await supabase
      .from("units")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", unitId)
  } catch (error) {
    console.error("Error updating unit after service:", error)
  }
}

export async function completeService(id: string, data: { notes?: string; actual_cost?: number }) {
  const supabase = createServerClient()

  try {
    const updateData: any = {
      status: "completed",
      updated_at: new Date().toISOString(),
    }

    if (data.notes) updateData.notes = data.notes
    if (data.actual_cost) updateData.total_cost = data.actual_cost

    const { data: service, error } = await supabase.from("services").update(updateData).eq("id", id).select().single()

    if (error) {
      throw new Error(`Error completing service: ${error.message}`)
    }

    revalidatePath("/services")
    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: service }
  } catch (error) {
    console.error("Error in completeService:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
