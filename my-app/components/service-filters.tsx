"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

export function ServiceFilters() {
  const router = useRouter()
  const sp = useSearchParams()

  const [search, setSearch] = useState(sp.get("search") ?? "")
  const [serviceType, setServiceType] = useState(sp.get("service_type") ?? "all")
  const [status, setStatus] = useState(sp.get("status") ?? "all")
  const [severity, setSeverity] = useState(sp.get("severity") ?? "all")

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (serviceType !== "all") params.set("service_type", serviceType)
    if (status !== "all") params.set("status", status)
    if (severity !== "all") params.set("severity", severity)
    const q = params.toString()
    router.push(`/services${q ? `?${q}` : ""}`)
  }, [search, serviceType, status, severity, router])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por unidad, descripción o técnico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={serviceType} onValueChange={setServiceType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo de servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="corrective">Correctivo</SelectItem>
              <SelectItem value="preventive">Preventivo</SelectItem>
              <SelectItem value="inspection">Inspección</SelectItem>
              <SelectItem value="repair">Reparación</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="in_progress">En Proceso</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
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
