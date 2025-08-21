"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { createUnit, uploadUnitImageAction } from "@/lib/actions/units"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type FuelType = "electric" | "gas" | "diesel"
type UnitStatus = "active" | "maintenance" | "inactive"

export default function AddUnitDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fuelType, setFuelType] = useState<FuelType | "">("")
  const [status, setStatus] = useState<UnitStatus>("active")
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()

  const toInt = (v: FormDataEntryValue | null, fallback = 0) => {
    const n = Number.parseInt((v ?? "").toString(), 10)
    return Number.isFinite(n) ? n : fallback
  }

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      const data = {
        unit_number: (formData.get("unit_number") as string).trim(),
        brand: (formData.get("brand") as string).trim(),
        model: (formData.get("model") as string).trim(),
        serial_number: (formData.get("serial_number") as string).trim(),
        year: toInt(formData.get("year")),
        capacity_kg: toInt(formData.get("capacity_kg")),
        fuel_type: (formData.get("fuel_type") as FuelType) || "diesel",
        current_hours: toInt(formData.get("current_hours")),
        status: (formData.get("status") as UnitStatus) || "active",
        location: (formData.get("location") as string).trim(),
      }

      const result = await createUnit(data)

      if (result.success && result.data) {
        // Subir imagen si el usuario seleccionó archivo
        if (file) {
          const fd = new FormData()
          fd.append("unitId", result.data.id)
          fd.append("file", file)
          const up = await uploadUnitImageAction(fd)
          if (!up.success) {
            toast.error(up.error || "No se pudo subir la imagen")
          }
        }

        toast.success("Unidad creada exitosamente")
        setIsOpen(false)
        setFile(null)
        router.refresh()
      } else {
        toast.error(result.error || "Error al crear la unidad")
      }
    } catch {
      toast.error("Error inesperado al crear la unidad")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Unidad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Unidad</DialogTitle>
          <DialogDescription>Ingresa los datos técnicos del montacargas</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {/* inputs ocultos para capturar selects en FormData */}
          <input type="hidden" name="fuel_type" value={fuelType} />
          <input type="hidden" name="status" value={status} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">Número de Unidad *</Label>
              <Input id="unit_number" name="unit_number" placeholder="FL-006" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input id="brand" name="brand" placeholder="Toyota" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input id="model" name="model" placeholder="8FGU25" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Número de Serie *</Label>
              <Input id="serial_number" name="serial_number" placeholder="TY2024001" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año *</Label>
              <Input id="year" name="year" type="number" placeholder="2024" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity_kg">Capacidad (kg) *</Label>
              <Input id="capacity_kg" name="capacity_kg" type="number" placeholder="2500" required />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Combustible *</Label>
              <Select value={fuelType} onValueChange={(v: FuelType) => setFuelType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electric">Eléctrico</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_hours">Horómetro Actual *</Label>
              <Input id="current_hours" name="current_hours" type="number" placeholder="0" required />
            </div>

            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select value={status} onValueChange={(v: UnitStatus) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación *</Label>
              <Input id="location" name="location" placeholder="Almacén Principal" required />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="image">Imagen (opcional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading || !fuelType || !status}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
