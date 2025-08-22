// components/report-anomaly-dialog.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { createAnomaly } from "@/lib/actions/anomalies"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type UnitOption = { id: string; unit_number: string }
type Severity = "low" | "medium" | "high" | "critical"
type Category = "mechanical" | "electrical" | "hydraulic" | "operational" | "safety" | "other"

export default function ReportAnomalyDialog({
  units,
  reporters,
}: {
  units: UnitOption[]
  reporters: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // form state
  const [unitId, setUnitId] = useState<string>("")
  const [reportedBy, setReportedBy] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [severity, setSeverity] = useState<Severity | "">("")
  const [category, setCategory] = useState<Category | "">("")
  const [estimated, setEstimated] = useState<string>("")

  const toNum = (v: string) => {
    const n = Number.parseFloat(v)
    return Number.isFinite(n) ? n : undefined
  }

  async function onSubmit() {
    if (!unitId || !reportedBy || !description || !severity) {
      toast.error("Completa los campos obligatorios")
      return
    }
    setLoading(true)
    try {
      const res = await createAnomaly({
        unit_id: unitId,
        description,
        severity: severity as Severity,
        reported_by: reportedBy,
        anomaly_type: (category || undefined) as Category | undefined,
        estimated_repair_cost: toNum(estimated),
      })
      if (res.success) {
        toast.success("Anomalía reportada")
        setOpen(false)
        // reset
        setUnitId("")
        setReportedBy("")
        setDescription("")
        setSeverity("")
        setCategory("")
        setEstimated("")
        router.refresh()
      } else {
        toast.error(res.error || "No se pudo crear")
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
          Reportar Anomalía
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reportar Nueva Anomalía</DialogTitle>
          <DialogDescription>Documenta un problema o observación operativa</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Reportado por *</Label>
              <Select value={reportedBy} onValueChange={setReportedBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {reporters.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Si necesitas entrada libre, puedes reemplazar el Select por <Input /> */}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Textarea
              placeholder="Describe el problema, síntomas y condiciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Severidad *</Label>
              <Select
                value={severity}
                onValueChange={(v: Severity) => setSeverity(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar severidad" />
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
              <Label>Categoría</Label>
              <Select
                value={category}
                onValueChange={(v: Category) => setCategory(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanical">Mecánica</SelectItem>
                  <SelectItem value="electrical">Eléctrica</SelectItem>
                  <SelectItem value="hydraulic">Hidráulica</SelectItem>
                  <SelectItem value="operational">Operativa</SelectItem>
                  <SelectItem value="safety">Seguridad</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Costo Estimado</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={estimated}
                onChange={(e) => setEstimated(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" disabled={loading} onClick={onSubmit}>
              {loading ? "Guardando..." : "Reportar"}
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
