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
import { getUnits } from "@/lib/actions/units"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const MAINTENANCE_INTERVALS = [250, 500, 750, 1000, 2000, 3000]

export function ScheduleMaintenanceDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnit, setSelectedUnit] = useState("")
  const [selectedInterval, setSelectedInterval] = useState("")
  const [nextServiceHours, setNextServiceHours] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUnits() {
      const result = await getUnits()
      if (result.success) {
        setUnits(result.data)
      }
    }
    loadUnits()
  }, [])

  useEffect(() => {
    if (selectedUnit && selectedInterval) {
      const unit = units.find((u) => u.id === selectedUnit)
      if (unit) {
        const intervalHours = Number.parseInt(selectedInterval)
        const cycles = Math.ceil(unit.current_hours / intervalHours)
        const nextHours = cycles * intervalHours
        setNextServiceHours(nextHours > unit.current_hours ? nextHours : nextHours + intervalHours)
      }
    } else {
      setNextServiceHours(null)
    }
  }, [selectedUnit, selectedInterval, units])

  async function handleSubmit(formData: FormData) {
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
    } catch (error) {
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
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Unidad *</Label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_number} - {unit.current_hours.toLocaleString()}h
                    <div className="text-sm text-muted-foreground">
                      {unit.brand} {unit.model}
                    </div>
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
                    <div>
                      <div className="font-medium">{interval} horas</div>
                      <div className="text-sm text-muted-foreground">
                        {interval <= 500
                          ? "Mantenimiento básico"
                          : interval <= 1000
                            ? "Mantenimiento intermedio"
                            : "Mantenimiento mayor"}
                      </div>
                    </div>
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading || !selectedUnit || !selectedInterval}>
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
