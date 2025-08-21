// my-app/components/reports-period-picker.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPeriodPicker({ value }: { value: string }) {
  const router = useRouter()
  const sp = useSearchParams()

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const params = new URLSearchParams(sp.toString())
        if (v) params.set("period", v)
        router.push(`/reports?${params.toString()}`)
      }}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="current_month">Mes Actual</SelectItem>
        <SelectItem value="last_month">Mes Anterior</SelectItem>
        <SelectItem value="quarter">Trimestre</SelectItem>
        <SelectItem value="year">Año</SelectItem>
      </SelectContent>
    </Select>
  )
}
