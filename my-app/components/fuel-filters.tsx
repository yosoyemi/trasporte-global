"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"

export default function FuelFilters({
  units,
}: {
  units: { id: string; unit_number: string }[]
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const [period, setPeriod] = useState(sp.get("period_type") ?? "all")
  const [unitId, setUnitId] = useState(sp.get("unit_id") ?? "all")

  useEffect(() => {
    const params = new URLSearchParams()
    if (period !== "all") params.set("period_type", period)
    if (unitId !== "all") params.set("unit_id", unitId)
    const q = params.toString()
    router.push(`/fuel${q ? `?${q}` : ""}`)
  }, [period, unitId, router])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los períodos</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>

          <Select value={unitId} onValueChange={setUnitId}>
            <SelectTrigger>
              <SelectValue placeholder="Unidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las unidades</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.unit_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
