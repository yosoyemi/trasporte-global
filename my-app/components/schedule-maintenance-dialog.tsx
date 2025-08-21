"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { schedulePreventiveMaintenance } from "@/lib/actions/maintenance"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MAINTENANCE_INTERVALS } from "@/lib/constants/maintenance"

type UnitOption = {
  id: string
  unit_number: string
  brand: string
  model: string
  current_hours: number
}

export function ScheduleMaintenanceDialog({ units }: { units: UnitOption[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [selectedInterval, setSelectedInterval] = useState("")
  const [nextServiceHours, setNextServiceHours] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (selectedUnit && selectedInterval) {
      const unit = units.find((u) => u.id === selectedUnit)
      if (unit) {
        const intervalHours = Number.parseInt(selectedInterval)
        const nextHours = Math.ceil((unit.current_hours + 1) / intervalHours) * intervalHours
        setNextServiceHours(nextHours)
      }
    } else {
      setNextServiceHours(null)
    }
  }, [selectedUnit, selectedInterval, units])

  async function handleSubmit() {
    if (!selectedUnit || !selectedInterval) return
    setIsLoading(true)
    try {
      const result = await schedulePreventiveMaintenance(selectedUnit, Number.parseInt(selectedInterval))
      if (result.success) {
        toast.success("Mantenimiento programado exitosamente")
        setIsOpen(false)
        setSelectedUnit("")
        setSelectedInterval("")
        setNextServiceHours(null)
        router.refresh()
      } else {
        toast.error(result.error || "Error al programar el mantenimiento")
      }
    } catch {
      toast.error("Error inesperado al programar el mantenimiento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Programar Mantenimiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Programar Nuevo Mantenimiento</DialogTitle>
          <DialogDescription>Selecciona la unidad e intervalo de mantenimiento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Unidad *</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                {units.length === 0 && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">No hay unidades disponibles</div>
                )}
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_number} — {unit.brand} {unit.model} · {unit.current_hours.toLocaleString()}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo de Mantenimiento *</Label>
            <Select value={selectedInterval} onValueChange={setSelectedInterval} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar intervalo" />
              </SelectTrigger>
              <SelectContent>
                {MAINTENANCE_INTERVALS.map((interval) => (
                  <SelectItem key={interval} value={interval.toString()}>
                    {interval} horas
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {nextServiceHours && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Próximo servicio programado:</p>
              <p className="text-lg font-bold">{nextServiceHours.toLocaleString()}h</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={isLoading || !selectedUnit || !selectedInterval}>
              {isLoading ? "Programando..." : "Programar"}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
