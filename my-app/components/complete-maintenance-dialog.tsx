"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle } from "lucide-react"
import { completeMaintenanceSchedule } from "@/lib/actions/maintenance"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface CompleteMaintenanceDialogProps {
  maintenanceId: string
}

export function CompleteMaintenanceDialog({ maintenanceId }: CompleteMaintenanceDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    try {
      const data = {
        actual_cost: Number.parseFloat((formData.get("actual_cost") as string) || "0"),
        technician: (formData.get("technician") as string) || "",
        notes: (formData.get("notes") as string) || undefined,
      }

      const result = await completeMaintenanceSchedule(maintenanceId, data)

      if (result.success) {
        toast.success("Mantenimiento completado exitosamente")
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Error al completar el mantenimiento")
      }
    } catch {
      toast.error("Error inesperado al completar el mantenimiento")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <CheckCircle className="h-4 w-4" />
          Completar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Completar Mantenimiento</DialogTitle>
          <DialogDescription>Registra los detalles del mantenimiento realizado</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actual_cost">Costo Real (USD) *</Label>
            <Input id="actual_cost" name="actual_cost" type="number" step="0.01" placeholder="0.00" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician">Técnico Responsable *</Label>
            <Input id="technician" name="technician" placeholder="Nombre del técnico" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas del Servicio</Label>
            <Textarea id="notes" name="notes" placeholder="Detalles del mantenimiento realizado..." rows={3} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Completando..." : "Completar"}
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
