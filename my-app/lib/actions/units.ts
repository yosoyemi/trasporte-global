"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Unit = {
  id: string
  unit_number: string
  brand: string
  model: string
  serial_number: string
  year: number | null
  capacity_kg: number | null
  fuel_type: "electric" | "gas" | "diesel"
  current_hours: number | null
  status: "active" | "maintenance" | "inactive"
  location: string | null
  purchase_date?: string | null
  purchase_cost?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
  image_url: string | null
  last_service_date: string | null
  next_service_hours: number | null
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
  image_url?: string | null
}

export async function createUnit(data: CreateUnitData) {
  const supabase = createServerClient()
  try {
    const payload = {
      ...data,
      next_service_hours: (data.current_hours ?? 0) + 250,
    }

    const { data: unit, error } = await supabase
      .from("units")
      .insert([payload])
      .select("*")
      .single()

    if (error) {
      console.error("Error creating unit:", error)
      throw new Error(`Error creating unit: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath("/")
    return { success: true, data: unit as Unit }
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
      .select("*")
      .single()

    if (error) {
      console.error("Error updating unit:", error)
      throw new Error(`Error updating unit: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath(`/units/${id}`)
    revalidatePath("/")
    return { success: true, data: unit as Unit }
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
      const s = filters.search
      query = query.or(
        `unit_number.ilike.%${s}%,brand.ilike.%${s}%,model.ilike.%${s}%,serial_number.ilike.%${s}%`,
      )
    }

    const { data: units, error } = await query
    if (error) {
      console.error("Error fetching units:", error)
      throw new Error(`Error fetching units: ${error.message}`)
    }

    return { success: true, data: (units ?? []) as Unit[] }
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
    return { success: true, data: unit as Unit }
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
      .select("*")
      .single()

    if (error) {
      console.error("Error updating unit hours:", error)
      throw new Error(`Error updating unit hours: ${error.message}`)
    }

    revalidatePath("/units")
    revalidatePath(`/units/${id}`)
    revalidatePath("/")
    return { success: true, data: unit as Unit }
  } catch (error) {
    console.error("Error in updateUnitHours:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getUnitsSummary() {
  const supabase = createServerClient()
  try {
    const { data: units, error } = await supabase.from("units").select("status")
    if (error) {
      console.error("Error fetching units summary:", error)
      throw new Error(`Error fetching units summary: ${error.message}`)
    }

    const summary = {
      total: units?.length ?? 0,
      active: units?.filter((u: { status: string }) => u.status === "active").length ?? 0,
      maintenance: units?.filter((u: { status: string }) => u.status === "maintenance").length ?? 0,
      inactive: units?.filter((u: { status: string }) => u.status === "inactive").length ?? 0,
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error("Error in getUnitsSummary:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

/* =====================  IMAGEN: subir / eliminar  ===================== */

function extFromMime(mime: string) {
  if (mime?.includes("png")) return "png"
  if (mime?.includes("webp")) return "webp"
  return "jpg"
}

/** Server Action: FormData { unitId, file } */
export async function uploadUnitImageAction(formData: FormData) {
  const unitId = String(formData.get("unitId") || "")
  const file = formData.get("file") as File | null
  if (!unitId || !file) return { success: false, error: "Archivo o ID faltante" }

  const supabase = createServerClient()

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const ext = extFromMime(file.type || "image/jpeg")
  const folder = `units/${unitId}`
  const objectPath = `${folder}/main.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("units")
    .upload(objectPath, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: true,
      cacheControl: "3600",
    })

  if (uploadError) {
    console.error("upload error:", uploadError)
    return { success: false, error: uploadError.message }
  }

  // borrar residuos (otra extensión)
  const { data: files } = await supabase.storage.from("units").list(folder)
  const toDelete = files?.filter((f) => `${folder}/${f.name}` !== objectPath).map((f) => `${folder}/${f.name}`) ?? []
  if (toDelete.length) {
    await supabase.storage.from("units").remove(toDelete)
  }

  const { data: publicData } = supabase.storage.from("units").getPublicUrl(objectPath)
  const publicUrl = publicData.publicUrl

  const { error: dbError } = await supabase
    .from("units")
    .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", unitId)

  if (dbError) {
    console.error("db error:", dbError)
    return { success: false, error: dbError.message }
  }

  revalidatePath(`/units/${unitId}`)
  revalidatePath("/units")
  return { success: true, url: publicUrl }
}

export async function deleteUnitImage(unitId: string) {
  const supabase = createServerClient()
  const folder = `units/${unitId}`
  const { data: files, error: listErr } = await supabase.storage.from("units").list(folder)
  if (listErr) return { success: false, error: listErr.message }

  const paths = files?.map((f) => `${folder}/${f.name}`) ?? []
  if (paths.length) {
    const { error: delErr } = await supabase.storage.from("units").remove(paths)
    if (delErr) return { success: false, error: delErr.message }
  }

  const { error: dbErr } = await supabase
    .from("units")
    .update({ image_url: null, updated_at: new Date().toISOString() })
    .eq("id", unitId)
  if (dbErr) return { success: false, error: dbErr.message }

  revalidatePath(`/units/${unitId}`)
  revalidatePath("/units")
  return { success: true }
}
