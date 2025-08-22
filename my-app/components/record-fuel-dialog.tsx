// components/record-fuel-dialog.tsx
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
import { createFuelConsumption } from "@/lib/actions/fuel"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type UnitOption = { id: string; unit_number: string }
type PeriodType = "weekly" | "monthly"

export default function RecordFuelDialog({ units }: { units: UnitOption[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [unitId, setUnitId] = useState<string>("")
  const [periodType, setPeriodType] = useState<PeriodType | "">("")
  const [start, setStart] = useState<string>("")
  const [end, setEnd] = useState<string>("")
  const [liters, setLiters] = useState<string>("")
  const [hours, setHours] = useState<string>("")
  const [costPerLiter, setCostPerLiter] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  const efficiency =
    liters && hours ? (Number.parseFloat(liters) / Number.parseFloat(hours) || 0) : 0

  const totalCost =
    liters && costPerLiter
      ? Number.parseFloat(liters) * Number.parseFloat(costPerLiter)
      : undefined

  async function onSubmit() {
    if (!unitId || !periodType || !start || !end || !liters || !hours) {
      toast.error("Completa los campos obligatorios")
      return
    }
    setLoading(true)
    try {
      const res = await createFuelConsumption({
        unit_id: unitId,
        period_type: periodType as PeriodType,
        period_start: start,
        period_end: end,
        fuel_consumed_liters: Number.parseFloat(liters),
        hours_operated: Number.parseFloat(hours),
        cost_per_liter: costPerLiter ? Number.parseFloat(costPerLiter) : undefined,
        notes: notes || undefined,
      })
      if (res.success) {
        toast.success("Consumo registrado")
        setOpen(false)
        setUnitId("")
        setPeriodType("")
        setStart("")
        setEnd("")
        setLiters("")
        setHours("")
        setCostPerLiter("")
        setNotes("")
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo registrar")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Consumo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Consumo de Combustible</DialogTitle>
          <DialogDescription>Registra el consumo para un período específico</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Unidad *</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unit_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Período *</Label>
            <Select
              value={periodType}
              onValueChange={(v: PeriodType) => setPeriodType(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha Inicio *</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Fin *</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Combustible (L) *</Label>
              <Input type="number" step="0.01" value={liters} onChange={(e) => setLiters(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horas Operadas *</Label>
              <Input type="number" step="0.01" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Costo por Litro (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={costPerLiter}
                onChange={(e) => setCostPerLiter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Estimado</Label>
              <Input readOnly value={totalCost !== undefined ? totalCost.toFixed(2) : ""} placeholder="$0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>

          {liters && hours ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Eficiencia calculada:</p>
              <p className="text-lg font-bold">{efficiency.toFixed(2)} L/h</p>
            </div>
          ) : null}

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" disabled={loading} onClick={onSubmit}>
              {loading ? "Guardando..." : "Registrar"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
