import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"
import { Calendar, Clock, CheckCircle, AlertTriangle, Wrench } from "lucide-react"
import { getMaintenanceSchedules, getMaintenanceSummary, MAINTENANCE_INTERVALS } from "@/lib/actions/maintenance"
import { MaintenanceFilters } from "@/components/maintenance-filters"
import { ScheduleMaintenanceDialog } from "@/components/schedule-maintenance-dialog"
import { CompleteMaintenanceDialog } from "@/components/complete-maintenance-dialog"

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const status = typeof searchParams.status === "string" ? searchParams.status : "all"
  const unit_id = typeof searchParams.unit_id === "string" ? searchParams.unit_id : undefined
  const maintenance_type = typeof searchParams.maintenance_type === "string" ? searchParams.maintenance_type : "all"

  const [schedulesResult, summaryResult] = await Promise.all([
    getMaintenanceSchedules({ status, unit_id, maintenance_type }),
    getMaintenanceSummary(),
  ])

  const schedules = schedulesResult.success ? schedulesResult.data : []
  const summary = summaryResult.success
    ? summaryResult.data
    : {
        total: 0,
        pending: 0,
        overdue: 0,
        completed: 0,
        preventive: 0,
        corrective: 0,
      }

  const getStatusBadge = (schedule: any) => {
    if (schedule.status === "completed") {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
    }
    if (schedule.status === "overdue") {
      return <Badge variant="destructive">Vencido</Badge>
    }
    if (schedule.current_unit_hours >= schedule.scheduled_hours) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    const hoursRemaining = schedule.scheduled_hours - schedule.current_unit_hours
    if (hoursRemaining <= 50) {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Próximo</Badge>
    }
    return <Badge variant="outline">Programado</Badge>
  }

  const upcomingCount = schedules.filter(
    (s) => s.status === "pending" && s.scheduled_hours - s.current_unit_hours <= 50,
  ).length

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
            <ScheduleMaintenanceDialog />
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

          {/* Tabs for different views */}
          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">Lista</TabsTrigger>
              <TabsTrigger value="calendar">Calendario</TabsTrigger>
              <TabsTrigger value="intervals">Intervalos</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {/* Filters */}
              <MaintenanceFilters />

              {/* Maintenance Schedule Table */}
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
                          <TableCell>{schedule.scheduled_hours.toLocaleString()}h</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {schedule.current_unit_hours.toLocaleString()}h
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(schedule)}</TableCell>
                          <TableCell>{new Date(schedule.scheduled_date).toLocaleDateString("es-ES")}</TableCell>
                          <TableCell>
                            $
                            {schedule.status === "completed" && schedule.actual_cost
                              ? schedule.actual_cost.toFixed(2)
                              : schedule.estimated_cost.toFixed(2)}
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
