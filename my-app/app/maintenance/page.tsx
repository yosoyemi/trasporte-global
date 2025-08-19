// app/maintenance/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Sidebar from "@/components/sidebar"
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench } from "lucide-react"
import { getMaintenanceSchedules, getMaintenanceSummary } from "@/lib/actions/maintenance"
import { getUnits } from "@/lib/actions/units"
import { MAINTENANCE_INTERVALS } from "@/lib/constants/maintenance"
import { MaintenanceFilters } from "@/components/maintenance-filters"
import { ScheduleMaintenanceDialog } from "@/components/schedule-maintenance-dialog"
import { CompleteMaintenanceDialog } from "@/components/complete-maintenance-dialog"

type RawSearchParams = Record<string, string | string[] | undefined>

type ScheduleRow = {
  id: string
  status: "pending" | "overdue" | "completed"
  interval_hours: number
  scheduled_hours?: number | null
  current_unit_hours?: number | null
  scheduled_date?: string | null
  estimated_cost?: number | null
  actual_cost?: number | null
  unit?: {
    unit_number?: string | null
    brand?: string | null
    model?: string | null
  } | null
}

type Summary = {
  total: number
  pending: number
  overdue: number
  completed: number
  preventive: number
  corrective: number
}

export default async function MaintenancePage(props: {
  // Next 15: Promise o undefined
  searchParams?: Promise<RawSearchParams>
}) {
  // Normalizamos (si viene undefined, usamos {}).
  const sp: RawSearchParams = await (props.searchParams ?? Promise.resolve({} as RawSearchParams))

  const status = typeof sp.status === "string" ? sp.status : "all"
  const unit_id = typeof sp.unit_id === "string" ? sp.unit_id : undefined
  const maintenance_type = typeof sp.maintenance_type === "string" ? sp.maintenance_type : "all"

  const [schedulesResult, summaryResult, unitsResult] = await Promise.all([
    getMaintenanceSchedules({ status, unit_id, maintenance_type }),
    getMaintenanceSummary(),
    getUnits(),
  ])

  const schedules: ScheduleRow[] = (schedulesResult.success ? schedulesResult.data : []) as ScheduleRow[]
  const summary: Summary = summaryResult.success
    ? (summaryResult.data as Summary)
    : { total: 0, pending: 0, overdue: 0, completed: 0, preventive: 0, corrective: 0 }

  const units =
    unitsResult?.success && Array.isArray(unitsResult.data)
      ? unitsResult.data.map((u) => ({
          id: String((u as { id: string | number }).id),
          unit_number: (u as { unit_number?: string }).unit_number ?? "N/A",
          brand: (u as { brand?: string }).brand ?? "",
          model: (u as { model?: string }).model ?? "",
          current_hours: Number((u as { current_hours?: number }).current_hours ?? 0),
        }))
      : []

  const getStatusBadge = (schedule: ScheduleRow) => {
    if (schedule.status === "completed") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
    }
    if (schedule.status === "overdue") {
      return <Badge variant="destructive">Vencido</Badge>
    }
    const current = schedule.current_unit_hours ?? 0
    const target = schedule.scheduled_hours ?? Number.POSITIVE_INFINITY
    if (current >= target) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    const hoursRemaining = target - current
    if (Number.isFinite(hoursRemaining) && hoursRemaining <= 50) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Próximo</Badge>
    }
    return <Badge variant="outline">Programado</Badge>
  }

  const upcomingCount = schedules.filter((s) => {
    if (s.status !== "pending") return false
    const current = s.current_unit_hours ?? 0
    const target = s.scheduled_hours ?? Number.POSITIVE_INFINITY
    return Number.isFinite(target) && target - current <= 50
  }).length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Mantenimientos Preventivos</h1>
              <p className="text-muted-foreground mt-1">Programación y seguimiento de mantenimientos</p>
            </div>
            <ScheduleMaintenanceDialog units={units} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Programados</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.pending}</div>
                <p className="text-xs text-muted-foreground">Mantenimientos pendientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.overdue}</div>
                <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{upcomingCount}</div>
                <p className="text-xs text-muted-foreground">En las próximas 50 horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="intervals">Intervalos</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <MaintenanceFilters />

              <Card>
                <CardHeader>
                  <CardTitle>Programación de Mantenimientos</CardTitle>
                  <CardDescription>{schedules.length} mantenimientos encontrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Horómetro Objetivo</TableHead>
                        <TableHead>Horómetro Actual</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Programada</TableHead>
                        <TableHead>Costo Estimado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">
                            {schedule.unit?.unit_number || "N/A"}
                            <div className="text-sm text-muted-foreground">
                              {schedule.unit?.brand} {schedule.unit?.model}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{schedule.interval_hours}h</Badge>
                          </TableCell>
                          <TableCell>
                            {typeof schedule.scheduled_hours === "number"
                              ? `${schedule.scheduled_hours.toLocaleString()}h`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {typeof schedule.current_unit_hours === "number"
                                ? `${schedule.current_unit_hours.toLocaleString()}h`
                                : "—"}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(schedule)}</TableCell>
                          <TableCell>
                            {schedule.scheduled_date
                              ? new Date(schedule.scheduled_date).toLocaleDateString("es-ES")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            $
                            {schedule.status === "completed" && typeof schedule.actual_cost === "number"
                              ? schedule.actual_cost.toFixed(2)
                              : (schedule.estimated_cost ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {schedule.status !== "completed" && (
                                <CompleteMaintenanceDialog maintenanceId={schedule.id} />
                              )}
                              <Button size="sm" variant="outline">
                                <Wrench className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Vista de Calendario</CardTitle>
                  <CardDescription>Visualización temporal de mantenimientos programados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4" />
                    <p>Vista de calendario en desarrollo</p>
                    <p className="text-sm">Próximamente: calendario interactivo con mantenimientos</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="intervals">
              <Card>
                <CardHeader>
                  <CardTitle>Intervalos de Mantenimiento</CardTitle>
                  <CardDescription>Configuración de intervalos estándar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MAINTENANCE_INTERVALS.map((interval) => (
                      <Card key={interval} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{interval} horas</CardTitle>
                          <CardDescription>
                            {interval <= 500
                              ? "Mantenimiento básico"
                              : interval <= 1000
                                ? "Mantenimiento intermedio"
                                : "Mantenimiento mayor"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">Unidades programadas:</div>
                            <div className="text-2xl font-bold">
                              {schedules.filter((s) => s.interval_hours === interval).length}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
