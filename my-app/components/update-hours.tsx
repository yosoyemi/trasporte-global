// components/update-hours.tsx
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateUnitHours } from "@/lib/actions/units"

export default function UpdateHours({ unitId, currentHours }: { unitId: string; currentHours: number }) {
  const [hours, setHours] = useState<number>(currentHours ?? 0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!Number.isFinite(hours) || hours < 0) {
      toast.error("Horas inválidas")
      return
    }
    setLoading(true)
    try {
      const res = await updateUnitHours(unitId, Math.floor(hours))
      if (res.success) {
        toast.success("Horómetro actualizado")
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
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-sm text-muted-foreground">Actualizar Horas</label>
        <Input
          type="number"
          value={hours}
          onChange={(e) => setHours(Number.parseInt(e.target.value || "0", 10))}
          min={0}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Actualizando..." : "Actualizar"}
      </Button>
    </form>
  )
}
