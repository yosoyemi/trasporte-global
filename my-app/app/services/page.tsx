import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Sidebar from "@/components/sidebar"
import { Wrench, DollarSign, Clock, User } from "lucide-react"
import { getServices, getServicesSummary, getServicesByTechnician } from "@/lib/actions/services"
import { getUnits } from "@/lib/actions/units"
import { ServiceFilters } from "@/components/service-filters"
import { CreateServiceDialog } from "@/components/create-service-dialog"

type RawSearchParams = Record<string, string | string[] | undefined>

type ServiceRow = {
  id: string
  unit_id: string
  service_type: "corrective" | "preventive" | "inspection" | "repair"
  description: string
  severity: "low" | "medium" | "high" | "critical"
  total_cost: number | null
  labor_cost: number | null
  parts_cost: number | null
  labor_hours: number | null
  technician: string | null
  service_date: string
  downtime_hours: number | null
  parts_used: string | null
  notes: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  hours_at_service: number
  unit?: {
    unit_number?: string | null
    brand?: string | null
    model?: string | null
    current_hours?: number | null
  } | null
}

export default async function ServicesPage(props: { searchParams?: Promise<RawSearchParams> }) {
  const sp: RawSearchParams = await (props.searchParams ?? Promise.resolve({} as RawSearchParams))

  const search = typeof sp.search === "string" ? sp.search : ""
  const service_type = typeof sp.service_type === "string" ? sp.service_type : "all"
  const status = typeof sp.status === "string" ? sp.status : "all"
  const severity = typeof sp.severity === "string" ? sp.severity : "all"
  const technician = typeof sp.technician === "string" ? sp.technician : undefined
  const date_from = typeof sp.date_from === "string" ? sp.date_from : undefined
  const date_to = typeof sp.date_to === "string" ? sp.date_to : undefined

  // Fetch data
  const [servicesRes, summaryRes, unitsRes, techStatsRes] = await Promise.all([
    getServices({ service_type, status, severity, technician, date_from, date_to }),
    getServicesSummary({ date_from, date_to }),
    getUnits(),
    getServicesByTechnician({ date_from, date_to }),
  ])

  const services: ServiceRow[] = (servicesRes.success ? servicesRes.data : []) as ServiceRow[]
  const summary = summaryRes.success
    ? summaryRes.data!
    : {
        total: 0,
        corrective: 0,
        preventive: 0,
        inspection: 0,
        repair: 0,
        low_severity: 0,
        medium_severity: 0,
        high_severity: 0,
        critical_severity: 0,
        total_cost: 0,
        total_labor_hours: 0,
        total_downtime: 0,
        average_cost: 0,
      }

  const units =
    unitsRes?.success && Array.isArray(unitsRes.data)
      ? unitsRes.data.map((u) => ({
          id: String((u as { id: string | number }).id),
          unit_number: (u as { unit_number?: string }).unit_number ?? "N/A",
          current_hours: Number((u as { current_hours?: number }).current_hours ?? 0),
          brand: (u as { brand?: string }).brand ?? "",
          model: (u as { model?: string }).model ?? "",
        }))
      : []

  const techStats = techStatsRes.success ? techStatsRes.data! : []

  // Search (in-memory, sobre lo ya filtrado por server)
  const filtered = services.filter((s) => {
    if (!search) return true
    const hay = [
      s.unit?.unit_number ?? "",
      s.description ?? "",
      s.technician ?? "",
      s.service_type ?? "",
      s.severity ?? "",
      s.status ?? "",
    ]
      .join(" ")
      .toLowerCase()
    return hay.includes(search.toLowerCase())
  })

  // Status counters (para tarjetas)
  const totalServices = services.length
  const completedServices = services.filter((s) => s.status === "completed").length
  const inProgressServices = services.filter((s) => s.status === "in_progress").length
  const totalCost = summary.total_cost

  const getStatusBadge = (st: ServiceRow["status"]) => {
    switch (st) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Proceso</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
      case "cancelled":
        return <Badge variant="secondary">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{st}</Badge>
    }
  }

  const getSeverityBadge = (sev: ServiceRow["severity"]) => {
    switch (sev) {
      case "critical":
        return <Badge variant="destructive">Crítica</Badge>
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Alta</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Media</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Baja</Badge>
      default:
        return <Badge variant="secondary">{sev}</Badge>
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Servicios Correctivos</h1>
              <p className="text-muted-foreground mt-1">Registro y seguimiento de reparaciones e intervenciones</p>
            </div>
            <CreateServiceDialog
              units={units.map((u) => ({
                id: u.id,
                unit_number: u.unit_number,
                current_hours: u.current_hours,
              }))}
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServices}</div>
                <p className="text-xs text-muted-foreground">Servicios registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completados</CardTitle>
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedServices}</div>
                <p className="text-xs text-muted-foreground">Reparaciones finalizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{inProgressServices}</div>
                <p className="text-xs text-muted-foreground">Servicios activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(totalCost ?? 0).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Inversión en reparaciones</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="services" className="space-y-4">
            <TabsList>
              <TabsTrigger value="services">Servicios</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
              <ServiceFilters />

              <Card>
                <CardHeader>
                  <CardTitle>Registro de Servicios</CardTitle>
                  <CardDescription>{filtered.length} servicios encontrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Técnico</TableHead>
                        <TableHead>Severidad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Tiempo Parada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{new Date(s.service_date).toLocaleDateString("es-ES")}</TableCell>
                          <TableCell className="font-medium">{s.unit?.unit_number ?? "N/A"}</TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate" title={s.description}>
                              {s.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {s.technician ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(s.severity)}</TableCell>
                          <TableCell>{getStatusBadge(s.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {(s.total_cost ?? 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {Number(s.downtime_hours ?? 0) > 0 ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-orange-500" />
                                {s.downtime_hours}h
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Servicios por Severidad</CardTitle>
                    <CardDescription>Distribución de servicios según criticidad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(["critical", "high", "medium", "low"] as const).map((sev) => {
                        const count = services.filter((s) => s.severity === sev).length
                        const percentage = services.length ? (count / services.length) * 100 : 0
                        const badge = getSeverityBadge(sev)
                        return (
                          <div key={sev} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {badge}
                              <span className="text-sm">{count} servicios</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Técnicos más Activos</CardTitle>
                    <CardDescription>Servicios realizados por técnico (último periodo)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {techStats.length === 0 && (
                        <div className="text-sm text-muted-foreground">No hay datos de técnicos</div>
                      )}
                      {techStats.slice(0, 6).map((t) => (
                        <div key={t.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{t.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{t.total_services} servicios</div>
                            <div className="text-xs text-muted-foreground">${t.total_cost.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
