"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Unit = {
  id: string
  unit_number: string
  brand: string
  model: string
  serial_number: string
  year: number
  capacity_kg: number
  fuel_type: "electric" | "gas" | "diesel"
  current_hours: number
  status: "active" | "maintenance" | "inactive"
  location: string
  last_service_date: string | null
  next_service_hours: number | null
  created_at: string
  updated_at: string
}

export type CreateUnitData = {
  unit_number: string
  brand: string
  model: string
  serial_number: string
  year: number
  capacity_kg: number
  fuel_type: "electric" | "gas" | "diesel"
  current_hours: number
  status: "active" | "maintenance" | "inactive"
  location: string
}

export type UpdateUnitData = Partial<CreateUnitData> & {
  id: string
}

export async function createUnit(data: CreateUnitData) {
  const supabase = createServerClient()

  try {
    const { data: unit, error } = await supabase
      .from("units")
      .insert([
        {
          ...data,
          next_service_hours: data.current_hours + 250, // Default first service at 250 hours
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating unit:", error)
      throw new Error(`Error creating unit: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: unit }
  } catch (error) {
    console.error("Error in createUnit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateUnit(data: UpdateUnitData) {
  const supabase = createServerClient()

  try {
    const { id, ...updateData } = data
    const { data: unit, error } = await supabase
      .from("units")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating unit:", error)
      throw new Error(`Error updating unit: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath(`/units/${id}`)
    revalidatePath("/")
    return { success: true, data: unit }
  } catch (error) {
    console.error("Error in updateUnit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteUnit(id: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("units").delete().eq("id", id)

    if (error) {
      console.error("Error deleting unit:", error)
      throw new Error(`Error deleting unit: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteUnit:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getUnits(filters?: {
  status?: string
  fuel_type?: string
  brand?: string
  search?: string
}) {
  const supabase = createServerClient()

  try {
    let query = supabase.from("units").select("*").order("unit_number", { ascending: true })

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status)
    }

    if (filters?.fuel_type && filters.fuel_type !== "all") {
      query = query.eq("fuel_type", filters.fuel_type)
    }

    if (filters?.brand && filters.brand !== "all") {
      query = query.eq("brand", filters.brand)
    }

    if (filters?.search) {
      query = query.or(
        `unit_number.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`,
      )
    }

    const { data: units, error } = await query

    if (error) {
      console.error("Error fetching units:", error)
      throw new Error(`Error fetching units: ${error.message}`)
    }

    return { success: true, data: units || [] }
  } catch (error) {
    console.error("Error in getUnits:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", data: [] }
  }
}

export async function getUnitById(id: string) {
  const supabase = createServerClient()

  try {
    const { data: unit, error } = await supabase.from("units").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching unit:", error)
      throw new Error(`Error fetching unit: ${error.message}`)
    }

    return { success: true, data: unit }
  } catch (error) {
    console.error("Error in getUnitById:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateUnitHours(id: string, newHours: number) {
  const supabase = createServerClient()

  try {
    const { data: unit, error } = await supabase
      .from("units")
      .update({
        current_hours: newHours,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating unit hours:", error)
      throw new Error(`Error updating unit hours: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath(`/units/${id}`)
    revalidatePath("/")
    return { success: true, data: unit }
  } catch (error) {
    console.error("Error in updateUnitHours:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getUnitsSummary() {
  const supabase = createServerClient()

  try {
    const { data: units, error } = await supabase.from("units").select("status, fuel_type")

    if (error) {
      console.error("Error fetching units summary:", error)
      throw new Error(`Error fetching units summary: ${error.message}`)
    }

    const summary = {
      total: units?.length || 0,
      active: units?.filter((u) => u.status === "active").length || 0,
      maintenance: units?.filter((u) => u.status === "maintenance").length || 0,
      inactive: units?.filter((u) => u.status === "inactive").length || 0,
      electric: units?.filter((u) => u.fuel_type === "electric").length || 0,
      gas: units?.filter((u) => u.fuel_type === "gas").length || 0,
      diesel: units?.filter((u) => u.fuel_type === "diesel").length || 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error in getUnitsSummary:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
