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
import { createUnit } from "@/lib/actions/units"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function AddUnitDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)

    try {
      const data = {
        unit_number: formData.get("unit_number") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        serial_number: formData.get("serial_number") as string,
        year: Number.parseInt(formData.get("year") as string),
        capacity_kg: Number.parseInt(formData.get("capacity_kg") as string),
        fuel_type: formData.get("fuel_type") as "electric" | "gas" | "diesel",
        current_hours: Number.parseInt(formData.get("current_hours") as string),
        status: formData.get("status") as "active" | "maintenance" | "inactive",
        location: formData.get("location") as string,
      }

      const result = await createUnit(data)

      if (result.success) {
        toast.success("Unidad creada exitosamente")
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Error al crear la unidad")
      }
    } catch (error) {
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
              <Label htmlFor="fuel_type">Tipo de Combustible *</Label>
              <Select name="fuel_type" required>
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
              <Label htmlFor="status">Estado *</Label>
              <Select name="status" defaultValue="active" required>
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
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
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
