import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Fuel, TrendingUp } from "lucide-react"
import { getFuelConsumption, getFuelConsumptionSummary } from "@/lib/actions/fuel"
import RecordFuelDialog from "@/components/record-fuel-dialog"
import FuelFilters from "@/components/fuel-filters"
import { getUnitsForSelect } from "@/lib/actions/anomalies" // reutilizamos helper

type RawSearchParams = Record<string, string | string[] | undefined>

const effBadge = (eff: number) => {
  if (eff >= 1.35) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excelente</Badge>
  if (eff >= 1.25) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Buena</Badge>
  if (eff >= 1.15) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Regular</Badge>
  return <Badge variant="destructive">Deficiente</Badge>
}

export default async function FuelPage(props: { searchParams?: Promise<RawSearchParams> }) {
  const sp: RawSearchParams = await (props.searchParams ?? Promise.resolve({} as RawSearchParams))
  const period_type = typeof sp.period_type === "string" ? sp.period_type : "all"
  const unit_id = typeof sp.unit_id === "string" ? sp.unit_id : "all"

  const [listRes, summaryRes, unitsRes] = await Promise.all([
    getFuelConsumption({ period_type, unit_id }),
    getFuelConsumptionSummary(),
    getUnitsForSelect(),
  ])

  const records = listRes.success ? listRes.data : []
  const summary = summaryRes.success && summaryRes.data
    ? summaryRes.data
    : { total_records: 0, total_liters: 0, total_cost_usd: 0, total_hours: 0, average_efficiency: 0 }

  const units = unitsRes.success ? unitsRes.data : []

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Control de Combustible</h1>
              <p className="text-muted-foreground mt-1">Seguimiento y análisis del consumo</p>
            </div>
            <RecordFuelDialog units={units} />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_liters.toFixed(2)} L</div>
                <p className="text-xs text-muted-foreground">{summary.total_records} registros</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.total_cost_usd.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Periodo filtrado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
                <div className="text-muted-foreground">⏱️</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_hours.toFixed(2)} h</div>
                <p className="text-xs text-muted-foreground">Uso acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.average_efficiency.toFixed(2)} L/h</div>
                <p className="text-xs text-muted-foreground">Flota completa</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <FuelFilters units={units} />

          {/* Tabla de registros */}
          <Card>
            <CardHeader>
              <CardTitle>Registros de Consumo</CardTitle>
              <CardDescription>{records.length} registros encontrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Combustible (L)</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Eficiencia</TableHead>
                    <TableHead>Costo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.unit?.unit_number ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.period_type === "weekly" ? "Semanal" : "Mensual"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{new Date(r.period_start).toLocaleDateString("es-ES")}</div>
                        <div className="text-muted-foreground">{new Date(r.period_end).toLocaleDateString("es-ES")}</div>
                      </TableCell>
                      <TableCell>{(r.fuel_consumed_liters ?? 0).toFixed(2)}</TableCell>
                      <TableCell>{(r.hours_operated ?? 0).toFixed(2)} h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{(r.efficiency_lph ?? 0).toFixed(2)} L/h</span>
                          {effBadge(r.efficiency_lph ?? 0)}
                        </div>
                      </TableCell>
                      <TableCell>${(r.fuel_cost_usd ?? 0).toFixed(2)}</TableCell>
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
