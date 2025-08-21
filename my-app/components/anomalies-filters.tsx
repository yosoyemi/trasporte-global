"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AnomaliesFilters() {
  const router = useRouter()
  const sp = useSearchParams()

  const [search, setSearch] = useState(sp.get("search") ?? "")
  const [status, setStatus] = useState(sp.get("status") ?? "all")
  const [severity, setSeverity] = useState(sp.get("severity") ?? "all")

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status !== "all") params.set("status", status)
    if (severity !== "all") params.set("severity", severity)
    const q = params.toString()
    router.push(`/anomalies${q ? `?${q}` : ""}`)
  }, [search, status, severity, router])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción o reportado por..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abiertas</SelectItem>
              <SelectItem value="in_progress">En Proceso</SelectItem>
              <SelectItem value="resolved">Resueltas</SelectItem>
              <SelectItem value="closed">Cerradas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue placeholder="Severidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
