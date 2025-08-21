import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Clock, DollarSign, User } from "lucide-react"
import ReportAnomalyDialog from "@/components/report-anomaly-dialog"
import AnomaliesFilters from "@/components/anomalies-filters"
import { getAnomalies, getAnomaliesSummary, getUnitsForSelect, getReporters } from "@/lib/actions/anomalies"
import type { Anomaly } from "@/lib/actions/anomalies"

type RawSearchParams = Record<string, string | string[] | undefined>

type Summary = {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  high_or_critical: number
  total_estimated: number
  total_actual: number
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return <Badge variant="destructive">Abierta</Badge>
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Proceso</Badge>
    case "resolved":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Resuelta</Badge>
    case "closed":
      return <Badge variant="secondary">Cerrada</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getSeverityBadge = (sev: string) => {
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

export default async function AnomaliesPage(props: { searchParams?: Promise<RawSearchParams> }) {
  // Next 15 puede entregar searchParams como Promise
  const sp: RawSearchParams = await (props.searchParams ?? Promise.resolve({} as RawSearchParams))
  const search = typeof sp.search === "string" ? sp.search : ""
  const status = typeof sp.status === "string" ? sp.status : "all"
  const severity = typeof sp.severity === "string" ? sp.severity : "all"

  const [anomsRes, summaryRes, unitsRes, reportersRes] = await Promise.all([
    getAnomalies({ search, status, severity }),
    getAnomaliesSummary(),
    getUnitsForSelect(),
    getReporters(),
  ])

  const anomalies: Anomaly[] = anomsRes.success ? (anomsRes.data as Anomaly[]) : []

  const summary: Summary =
    summaryRes.success && summaryRes.data
      ? (summaryRes.data as Summary)
      : {
          total: 0,
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          high_or_critical: 0,
          total_estimated: 0,
          total_actual: 0,
        }

  const units = unitsRes.success ? unitsRes.data : []
  const reporters = reportersRes.success ? reportersRes.data : []

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Reportes de Anomalías</h1>
              <p className="text-muted-foreground mt-1">Gestión de problemas y observaciones operativas</p>
            </div>
            <ReportAnomalyDialog units={units} reporters={reporters} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Anomalías</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
                <p className="text-xs text-muted-foreground">Reportes registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.open}</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.in_progress}</div>
                <p className="text-xs text-muted-foreground">Siendo atendidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Críticas/Altas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.high_or_critical}</div>
                <p className="text-xs text-muted-foreground">Prioridad alta</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <AnomaliesFilters />

          {/* Tabla */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Anomalías</CardTitle>
              <CardDescription>{anomalies.length} anomalías encontradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Reportado Por</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anomalies.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.report_date).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="font-medium">{a.unit?.unit_number ?? "—"}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate" title={a.description}>
                          {a.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {a.reported_by ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(a.severity)}</TableCell>
                      <TableCell>{getStatusBadge(a.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {((a as any).actual_repair_cost ?? (a as any).estimated_repair_cost ?? 0).toFixed(2)}
                        </div>
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
