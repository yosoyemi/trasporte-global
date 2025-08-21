// components/edit-unit-dialog.tsx
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
import { Edit } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Unit } from "@/lib/actions/units"
import { updateUnit } from "@/lib/actions/units"

type FuelType = "electric" | "gas" | "diesel"
type UnitStatus = "active" | "maintenance" | "inactive"

export default function EditUnitDialog({ unit }: { unit: Unit }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fuelType, setFuelType] = useState<FuelType>(unit.fuel_type)
  const [status, setStatus] = useState<UnitStatus>(unit.status as UnitStatus)

  const toInt = (v: FormDataEntryValue | null, fallback = 0) => {
    const n = Number.parseInt((v ?? "").toString(), 10)
    return Number.isFinite(n) ? n : fallback
  }

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const payload = {
        id: unit.id,
        unit_number: (formData.get("unit_number") as string).trim(),
        brand: (formData.get("brand") as string).trim(),
        model: (formData.get("model") as string).trim(),
        serial_number: (formData.get("serial_number") as string).trim(),
        year: toInt(formData.get("year")),
        capacity_kg: toInt(formData.get("capacity_kg")),
        fuel_type: (formData.get("fuel_type") as FuelType) || unit.fuel_type,
        status: (formData.get("status") as UnitStatus) || unit.status,
        location: (formData.get("location") as string).trim(),
        current_hours: toInt(formData.get("current_hours"), unit.current_hours ?? 0),
      }

      const res = await updateUnit(payload)
      if (res.success) {
        toast.success("Unidad actualizada")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo actualizar")
      }
    } catch {
      toast.error("Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="default">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Unidad</DialogTitle>
          <DialogDescription>Actualiza los datos de la unidad</DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="space-y-4">
          <input type="hidden" name="fuel_type" value={fuelType} />
          <input type="hidden" name="status" value={status} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_number">Número de Unidad</Label>
              <Input id="unit_number" name="unit_number" defaultValue={unit.unit_number} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" name="brand" defaultValue={unit.brand} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" name="model" defaultValue={unit.model} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serie</Label>
              <Input id="serial_number" name="serial_number" defaultValue={unit.serial_number} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input id="year" name="year" type="number" defaultValue={unit.year ?? 0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity_kg">Capacidad (kg)</Label>
              <Input id="capacity_kg" name="capacity_kg" type="number" defaultValue={unit.capacity_kg ?? 0} required />
            </div>

            <div className="space-y-2">
              <Label>Combustible</Label>
              <Select value={fuelType} onValueChange={(v: FuelType) => setFuelType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electric">Eléctrico</SelectItem>
                  <SelectItem value="gas">Gas</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v: UnitStatus) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input id="location" name="location" defaultValue={unit.location ?? ""} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_hours">Horómetro actual</Label>
              <Input id="current_hours" name="current_hours" type="number" defaultValue={unit.current_hours ?? 0} required />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
