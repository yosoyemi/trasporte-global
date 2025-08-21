"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createService } from "@/lib/actions/services"

type UnitOpt = { id: string; unit_number: string; current_hours: number }

export function CreateServiceDialog({ units }: { units: UnitOpt[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [unitId, setUnitId] = useState("")
  const [serviceType, setServiceType] = useState<"corrective" | "preventive" | "inspection" | "repair">("corrective")
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [serviceDate, setServiceDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [hoursAtService, setHoursAtService] = useState<number | "">("")
  const [technician, setTechnician] = useState("")
  const [laborHours, setLaborHours] = useState<number | "">("")
  const [partsCost, setPartsCost] = useState<number | "">("")
  const [laborCost, setLaborCost] = useState<number | "">("")
  const [totalCost, setTotalCost] = useState<number | "">("")
  const [downtime, setDowntime] = useState<number | "">("")
  const [description, setDescription] = useState("")
  const [partsUsed, setPartsUsed] = useState("")

  const router = useRouter()

  // Pre-cargar horas del horómetro al elegir unidad
  useEffect(() => {
    if (!unitId) return
    const u = units.find((x) => x.id === unitId)
    if (u) setHoursAtService(u.current_hours)
  }, [unitId, units])

  const computedTotal = useMemo(() => {
    const p = typeof partsCost === "number" ? partsCost : Number(partsCost || 0)
    const l = typeof laborCost === "number" ? laborCost : Number(laborCost || 0)
    return p + l
  }, [partsCost, laborCost])

  function num(v: unknown, def = 0) {
    const n = Number(v)
    return Number.isFinite(n) ? n : def
  }

  async function handleSubmit() {
    if (!unitId || !description) {
      toast.error("Selecciona la unidad y escribe una descripción.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        unit_id: unitId,
        service_type: serviceType,
        description,
        severity,
        total_cost: totalCost === "" ? computedTotal : num(totalCost, 0),
        labor_cost: num(laborCost, 0),
        parts_cost: num(partsCost, 0),
        labor_hours: num(laborHours, 0),
        technician: technician || "Sin asignar",
        service_date: serviceDate,
        downtime_hours: num(downtime, 0),
        hours_at_service: num(hoursAtService, 0),
        parts_used: partsUsed || undefined,
        notes: undefined,
        status: "completed" as const,
      }

      const res = await createService(payload)
      if (res.success) {
        toast.success("Servicio registrado correctamente")
        setOpen(false)
        // reset
        setUnitId("")
        setServiceType("corrective")
        setSeverity("medium")
        setServiceDate(new Date().toISOString().slice(0, 10))
        setHoursAtService("")
        setTechnician("")
        setLaborHours("")
        setPartsCost("")
        setLaborCost("")
        setTotalCost("")
        setDowntime("")
        setDescription("")
        setPartsUsed("")
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo crear el servicio")
      }
    } catch {
      toast.error("Error inesperado al crear el servicio")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Servicio</DialogTitle>
          <DialogDescription>Documenta una reparación o intervención</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Unidad *</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                {units.length === 0 && <div className="px-2 py-1 text-sm text-muted-foreground">Sin unidades</div>}
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unit_number} · {u.current_hours.toLocaleString()}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={serviceType} onValueChange={(v) => setServiceType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corrective">Correctivo</SelectItem>
                <SelectItem value="repair">Reparación</SelectItem>
                <SelectItem value="inspection">Inspección</SelectItem>
                <SelectItem value="preventive">Preventivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severidad *</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha *</Label>
            <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Horómetro *</Label>
            <Input
              type="number"
              placeholder="0"
              value={hoursAtService}
              onChange={(e) => setHoursAtService(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Técnico</Label>
            <Input placeholder="Nombre del técnico" value={technician} onChange={(e) => setTechnician(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Horas de Mano de Obra</Label>
            <Input
              type="number"
              placeholder="0"
              value={laborHours}
              step="0.1"
              onChange={(e) => setLaborHours(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Costo Partes (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              step="0.01"
              value={partsCost}
              onChange={(e) => setPartsCost(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Costo Mano de Obra (USD)</Label>
            <Input
              type="number"
              placeholder="0.00"
              step="0.01"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Costo Total (USD)</Label>
            <Input
              type="number"
              placeholder={`${computedTotal.toFixed(2)} (auto)`}
              step="0.01"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Tiempo de Paro (h)</Label>
            <Input
              type="number"
              placeholder="0"
              value={downtime}
              onChange={(e) => setDowntime(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label>Descripción *</Label>
            <Textarea
              placeholder="Describe el problema y la solución aplicada..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label>Partes / Materiales</Label>
            <Textarea
              placeholder="Lista de partes, materiales y consumibles utilizados..."
              rows={2}
              value={partsUsed}
              onChange={(e) => setPartsUsed(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button className="flex-1" onClick={handleSubmit} disabled={loading || !unitId || !description}>
            {loading ? "Guardando..." : "Registrar Servicio"}
          </Button>
          <Button className="flex-1" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
