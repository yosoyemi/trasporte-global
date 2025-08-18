import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Truck, Wrench, AlertTriangle, Fuel, Calendar, DollarSign, TrendingUp, Clock } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { getUnitsSummary } from "@/lib/actions/units"
import { getMaintenanceSummary } from "@/lib/actions/maintenance"
import { getServicesSummary, getMonthlyCosts } from "@/lib/actions/services"
import { getAnomaliesSummary } from "@/lib/actions/anomalies"
import { getFuelTrends } from "@/lib/actions/fuel"

export default async function Dashboard() {
  const [unitsResult, maintenanceResult, servicesResult, anomaliesResult, fuelResult, costsResult] = await Promise.all([
    getUnitsSummary(),
    getMaintenanceSummary(),
    getServicesSummary(),
    getAnomaliesSummary(),
    getFuelTrends(undefined, 6),
    getMonthlyCosts(),
  ])

  const units = unitsResult.success ? unitsResult.data : { total: 0, active: 0, maintenance: 0, inactive: 0 }
  const maintenance = maintenanceResult.success ? maintenanceResult.data : { pending: 0, overdue: 0, completed: 0 }
  const services = servicesResult.success ? servicesResult.data : { total_cost: 0 }
  const anomalies = anomaliesResult.success ? anomaliesResult.data : { open: 0, critical: 0, high: 0 }
  const fuelData = fuelResult.success ? fuelResult.data : []
  const monthlyCosts = costsResult.success ? costsResult.data : []

  const statusData = [
    { name: "Activos", value: units.active, color: "hsl(var(--chart-1))" },
    { name: "Mantenimiento", value: units.maintenance, color: "hsl(var(--chart-3))" },
    { name: "Inactivos", value: units.inactive, color: "hsl(var(--chart-4))" },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard de Montacargas</h1>
              <p className="text-muted-foreground mt-1">Resumen general del sistema de gestión</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Última actualización: {new Date().toLocaleDateString("es-ES")}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Total Unidades</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{units.total}</div>
                <p className="text-xs text-muted-foreground">
                  {units.active} activas, {units.maintenance + units.inactive} en servicio
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Mantenimientos Pendientes</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{maintenance.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {maintenance.overdue} vencidos, {maintenance.pending - maintenance.overdue} próximos
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Anomalías Abiertas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">{anomalies.open}</div>
                <p className="text-xs text-muted-foreground">
                  {anomalies.critical} críticas, {anomalies.high} altas
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">Costo Mensual</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-card-foreground">${services.total_cost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Servicios y mantenimientos</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fuel Consumption Chart */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Fuel className="h-5 w-5 text-primary" />
                  Consumo de Combustible
                </CardTitle>
                <CardDescription>Litros consumidos por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    fuel_consumed_liters: {
                      label: "Consumo (L)",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fuelData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="liters" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Monthly Costs Chart */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  Costos Mensuales
                </CardTitle>
                <CardDescription>Gastos en servicios por mes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    cost: {
                      label: "Costo ($)",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyCosts}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="text-muted-foreground" />
                      <YAxis className="text-muted-foreground" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cost" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fleet Status */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Estado de la Flota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Unidades",
                    },
                  }}
                  className="h-[200px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-col gap-2 mt-4">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-card-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-2 border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  Acciones Rápidas
                </CardTitle>
                <CardDescription>Funciones principales del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button className="h-16 flex flex-col gap-2 bg-primary hover:bg-primary/90">
                    <Truck className="h-5 w-5" />
                    <span className="text-sm">Agregar Unidad</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col gap-2 bg-transparent">
                    <Wrench className="h-5 w-5" />
                    <span className="text-sm">Programar Mantenimiento</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col gap-2 bg-transparent">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm">Reportar Anomalía</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex flex-col gap-2 bg-transparent">
                    <Fuel className="h-5 w-5" />
                    <span className="text-sm">Registrar Combustible</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
