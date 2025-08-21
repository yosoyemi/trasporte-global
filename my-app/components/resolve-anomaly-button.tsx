// my-app/components/resolve-anomaly-button.tsx
"use client"

import { Button } from "@/components/ui/button"

export default function ResolveAnomalyButton({ id, onResolved }: { id: string; onResolved?: () => void }) {
  const handleResolve = async () => {
    const notes = window.prompt("Notas de resolución (opcional):", "")
    const costStr = window.prompt("Costo real (opcional):", "0")
    const cost = costStr ? Number.parseFloat(costStr) : undefined

    try {
      const res = await fetch(`/api/anomalies/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution_notes: notes || undefined,
          actual_repair_cost: Number.isFinite(cost!) ? cost : undefined,
        }),
      })
      const json = await res.json()
      if (json?.success) {
        onResolved?.()
      } else {
        alert(json?.error || "No se pudo resolver la anomalía")
      }
    } catch {
      alert("Error inesperado al resolver")
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleResolve}>
      Resolver
    </Button>
  )
}
