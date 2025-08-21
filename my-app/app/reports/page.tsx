// my-app/app/reports/page.tsx
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DollarSign, AlertTriangle, Clock, Bell, Calendar, TrendingUp } from "lucide-react"

import ReportsPeriodPicker from "@/components/reports-period-picker"
import CostCharts, { type PieItem } from "@/components/cost-charts"
import ResolveAnomalyButton from "@/components/resolve-anomaly-button"

import { getMaintenanceSchedules } from "@/lib/actions/maintenance"
import { getAnomalies } from "@/lib/actions/anomalies"
import { getCostBreakdown, getMonthlyTrend, getDowntimeReport, periodToRange } from "@/lib/actions/costs"

type RawSearchParams = Record<string, string | string[] | undefined>

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<RawSearchParams> | RawSearchParams
}) {
  const sp: RawSearchParams =
    (searchParams &&
      (typeof (searchParams as any).then === "function"
        ? await (searchParams as Promise<RawSearchParams>)
        : (searchParams as RawSearchParams))) ||
    {}

  const period = typeof sp.period === "string" ? sp.period : "current_month"
  const { from, to } = periodToRange(period as any)

  const [schedulesRes, anomaliesRes, monthlyTrend] = await Promise.all([
    getMaintenanceSchedules(),
    getAnomalies({ status: "open", date_from: from, date_to: to }),
    getMonthlyTrend(),
  ])

  const breakdown = await getCostBreakdown(from, to)

  const schedules = (schedulesRes.success ? (schedulesRes.data as any[]) : []).map((s) => {
    const current = Number(s.unit?.current_hours ?? 0)
    const target = Number(s.next_service_hours ?? 0)
    const diff = target - current
    return {
      unitNumber: s.unit?.unit_number ?? "—",
      maintenanceType: `${s.interval_hours}h`,
      currentHours: current,
      scheduledHours: target,
      hoursUntilDue: diff,
      estimatedCost: Number(s.estimated_cost ?? 0),
    }
  })

  const overdueMaintenances = schedules.filter((m) => m.hoursUntilDue < 0).length
  const upcomingMaintenances = schedules.filter((m) => m.hoursUntilDue >= 0 && m.hoursUntilDue <= 50).length

  const anomalies = (anomaliesRes.success ? anomaliesRes.data : []).filter(
    (a) => a.status === "open" || a.status === "in_progress",
  )
  const highSeverityAlerts = anomalies.filter((a) => a.severity === "high" || a.severity === "critical").length

  const totalCosts = breakdown.total

  const pie: PieItem[] = [
    { category: "Mantenimientos Preventivos", amount: breakdown.preventive, percentage: 0 },
    { category: "Servicios Correctivos", amount: breakdown.corrective, percentage: 0 },
    { category: "Combustible", amount: breakdown.fuel, percentage: 0 },
    { category: "Repuestos y Materiales", amount: breakdown.parts, percentage: 0 },
  ]
  const pieTotal = pie.reduce((s, x) => s + x.amount, 0) || 1
  pie.forEach((x) => (x.percentage = Math.round((x.amount / pieTotal) * 100)))

  const downtimeRows = await getDowntimeReport(from, to)

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítica</Badge>
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Media</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Baja</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Reportes y Alertas</h1>
              <p className="text-muted-foreground mt-1">Análisis integral y alertas del sistema</p>
            </div>
            <div className="flex gap-2">
              <ReportsPeriodPicker value={period} />
              <Button className="gap-2">
                <DollarSign className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Cards resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalCosts.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Período seleccionado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mantenimientos Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueMaintenances}</div>
                <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos Servicios</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{upcomingMaintenances}</div>
                <p className="text-xs text-muted-foreground">En las próximas 50 horas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
                <Bell className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{highSeverityAlerts}</div>
                <p className="text-xs text-muted-foreground">Requieren acción inmediata</p>
              </CardContent>
            </Card>
          </div>

          {/* Mantenimientos */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planificación de Mantenimientos
              </CardTitle>
              <CardDescription>Unidades próximas por horas y vencidas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horómetro Actual</TableHead>
                    <TableHead>Horómetro Objetivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Costo Estimado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{m.unitNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.maintenanceType}</Badge>
                      </TableCell>
                      <TableCell>{m.currentHours.toLocaleString()}h</TableCell>
                      <TableCell>{m.scheduledHours.toLocaleString()}h</TableCell>
                      <TableCell>
                        {m.hoursUntilDue < 0 ? (
                          <Badge variant="destructive">{Math.abs(m.hoursUntilDue)}h vencido</Badge>
                        ) : m.hoursUntilDue <= 50 ? (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{m.hoursUntilDue}h</Badge>
                        ) : (
                          <Badge variant="outline">{m.hoursUntilDue}h</Badge>
                        )}
                      </TableCell>
                      <TableCell>${m.estimatedCost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Costos + resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia y Distribución de Costos</CardTitle>
                <CardDescription>Meses del año y desglose por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <CostCharts
                  pieData={pie}
                  monthly={monthlyTrend}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Costos</CardTitle>
                <CardDescription>Detalle por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pie.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
                        />
                        <div>
                          <div className="font-medium">{item.category}</div>
                          <div className="text-sm text-muted-foreground">{item.percentage}% del total</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${item.amount.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas Activas del Sistema
              </CardTitle>
              <CardDescription>Anomalías abiertas/en proceso</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay alertas activas</div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((a) => (
                    <div key={a.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{a.anomaly_type || "Anomalía"}</h4>
                          {getSeverityBadge(a.severity)}
                          <Badge variant="outline">{a.unit?.unit_number ?? "—"}</Badge>
                          {a.status === "open" ? (
                            <Badge variant="outline">Abierta</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En proceso</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{a.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {new Date(a.report_date).toLocaleString("es-ES")} · {a.reported_by || "—"}
                        </div>
                      </div>
                      <ResolveAnomalyButton id={a.id} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disponibilidad */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis de Disponibilidad
              </CardTitle>
              <CardDescription>Tiempo de parada y disponibilidad por unidad</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Tiempo Total Parada (h)</TableHead>
                    <TableHead>Parada Planificada (h)</TableHead>
                    <TableHead>Parada No Planificada (h)</TableHead>
                    <TableHead>Disponibilidad (%)</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downtimeRows.map((unit, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{unit.unit}</TableCell>
                      <TableCell>{unit.totalDowntime}h</TableCell>
                      <TableCell>{unit.plannedDowntime}h</TableCell>
                      <TableCell>{unit.unplannedDowntime}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{unit.availability}%</span>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                unit.availability >= 95
                                  ? "bg-green-500"
                                  : unit.availability >= 90
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${unit.availability}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {unit.availability >= 95 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excelente</Badge>
                        ) : unit.availability >= 90 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Buena</Badge>
                        ) : (
                          <Badge variant="destructive">Mejorar</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
