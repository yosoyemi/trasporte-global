// components/dashboard-client.tsx (Client Component)
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Truck, Wrench, AlertTriangle, Fuel, Calendar, DollarSign, TrendingUp, Clock } from "lucide-react"
import { FuelChart, MonthlyCostsChart, StatusPieChart } from "@/components/dashboard-charts"

type Units = { total: number; active: number; maintenance: number; inactive: number }
type Maintenance = { pending: number; overdue: number; completed: number }
type Services = { total_cost: number }
type Anomalies = { open: number; critical: number; high: number }
type FuelPoint = { month: string; liters: number }
type CostPoint = { month: string; cost: number }
type StatusPoint = { name: string; value: number; color: string }

export default function DashboardClient({
  units,
  maintenance,
  services,
  anomalies,
  fuelData,
  monthlyCosts,
  statusData,
}: {
  units: Units
  maintenance: Maintenance
  services: Services
  anomalies: Anomalies
  fuelData: FuelPoint[]
  monthlyCosts: CostPoint[]
  statusData: StatusPoint[]
}) {
  return (
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
                {maintenance.overdue} vencidos, {Math.max(maintenance.pending - maintenance.overdue, 0)} próximos
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
              <FuelChart data={fuelData} />
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
              <MonthlyCostsChart data={monthlyCosts} />
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
              <StatusPieChart data={statusData} />
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
  )
}
