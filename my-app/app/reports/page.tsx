// my-app/app/reports/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Sidebar from "@/components/sidebar"
import { Download, AlertTriangle, Clock, DollarSign, TrendingUp, Calendar, Wrench, Fuel, Bell } from "lucide-react"

// Mock data for reports
const upcomingMaintenanceReport = [
  { unitNumber: "FL-001", maintenanceType: "500h", currentHours: 1250, scheduledHours: 1500, daysUntilDue: 5, estimatedCost: 320.0, priority: "medium" },
  { unitNumber: "FL-003", maintenanceType: "1000h", currentHours: 2100, scheduledHours: 2000, daysUntilDue: -2, estimatedCost: 580.0, priority: "high" },
  { unitNumber: "FL-007", maintenanceType: "250h", currentHours: 890, scheduledHours: 1000, daysUntilDue: 8, estimatedCost: 180.0, priority: "low" },
  { unitNumber: "FL-012", maintenanceType: "2000h", currentHours: 1950, scheduledHours: 2000, daysUntilDue: 3, estimatedCost: 750.0, priority: "high" },
]

const costSummaryReport = [
  { category: "Mantenimientos Preventivos", amount: 2850.0, percentage: 45 },
  { category: "Servicios Correctivos", amount: 1920.5, percentage: 30 },
  { category: "Combustible", amount: 1280.75, percentage: 20 },
  { category: "Repuestos y Materiales", amount: 320.25, percentage: 5 },
]

const monthlyTrendData = [
  { month: "Oct", preventive: 1200, corrective: 800, fuel: 950 },
  { month: "Nov", preventive: 1450, corrective: 650, fuel: 1100 },
  { month: "Dic", preventive: 1100, corrective: 920, fuel: 1050 },
  { month: "Ene", preventive: 1350, corrective: 750, fuel: 1200 },
  { month: "Feb", preventive: 1250, corrective: 680, fuel: 1150 },
  { month: "Mar", preventive: 1400, corrective: 580, fuel: 1280 },
]

const alertsData = [
  { id: 1, type: "maintenance", severity: "high", title: "Mantenimiento Vencido", description: "FL-003 tiene mantenimiento de 1000h vencido por 2 días", unit: "FL-003", createdAt: "2024-03-15T10:30:00Z" },
  { id: 2, type: "fuel", severity: "medium", title: "Eficiencia de Combustible Baja", description: "FL-005 muestra eficiencia por debajo del promedio (1.22 L/h)", unit: "FL-005", createdAt: "2024-03-14T14:20:00Z" },
  { id: 3, type: "anomaly", severity: "high", title: "Anomalía Crítica Reportada", description: "FL-002 reporta fuga de aceite hidráulico en el mástil", unit: "FL-002", createdAt: "2024-03-14T09:15:00Z" },
  { id: 4, type: "maintenance", severity: "medium", title: "Mantenimiento Próximo", description: "FL-012 requiere mantenimiento de 2000h en 3 días", unit: "FL-012", createdAt: "2024-03-13T16:45:00Z" },
]

const downtimeReport = [
  { unit: "FL-001", totalDowntime: 12, plannedDowntime: 8, unplannedDowntime: 4, availability: 95.2 },
  { unit: "FL-002", totalDowntime: 18, plannedDowntime: 10, unplannedDowntime: 8, availability: 92.5 },
  { unit: "FL-003", totalDowntime: 24, plannedDowntime: 16, unplannedDowntime: 8, availability: 90.0 },
  { unit: "FL-004", totalDowntime: 8, plannedDowntime: 6, unplannedDowntime: 2, availability: 96.7 },
  { unit: "FL-005", totalDowntime: 20, plannedDowntime: 12, unplannedDowntime: 8, availability: 91.7 },
]

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("current_month")

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />
      case "fuel":
        return <Fuel className="h-4 w-4" />
      case "anomaly":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const totalCosts = costSummaryReport.reduce((sum, item) => sum + item.amount, 0)
  const overdueMaintenances = upcomingMaintenanceReport.filter((m) => m.daysUntilDue < 0).length
  const upcomingMaintenances = upcomingMaintenanceReport.filter((m) => m.daysUntilDue >= 0 && m.daysUntilDue <= 7).length
  const highSeverityAlerts = alertsData.filter((a) => a.severity === "high").length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Reportes y Alertas</h1>
              <p className="text-muted-foreground mt-1">Análisis integral y alertas del sistema</p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Mes Actual</SelectItem>
                  <SelectItem value="last_month">Mes Anterior</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Año</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
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
                <p className="text-xs text-muted-foreground">En los próximos 7 días</p>
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

          {/* Tabs for different reports */}
          <Tabs defaultValue="maintenance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="maintenance">Mantenimientos</TabsTrigger>
              <TabsTrigger value="costs">Costos</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
              <TabsTrigger value="downtime">Disponibilidad</TabsTrigger>
            </TabsList>

            <TabsContent value="maintenance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Planificación de Mantenimientos
                  </CardTitle>
                  <CardDescription>Unidades próximas a mantenimiento y vencidas</CardDescription>
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
                        <TableHead>Prioridad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingMaintenanceReport.map((maintenance, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{maintenance.unitNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{maintenance.maintenanceType}</Badge>
                          </TableCell>
                          <TableCell>{maintenance.currentHours.toLocaleString()}h</TableCell>
                          <TableCell>{maintenance.scheduledHours.toLocaleString()}h</TableCell>
                          <TableCell>
                            {maintenance.daysUntilDue < 0 ? (
                              <Badge variant="destructive">{Math.abs(maintenance.daysUntilDue)} días vencido</Badge>
                            ) : maintenance.daysUntilDue <= 3 ? (
                              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                {maintenance.daysUntilDue} días
                              </Badge>
                            ) : (
                              <Badge variant="outline">{maintenance.daysUntilDue} días</Badge>
                            )}
                          </TableCell>
                          <TableCell>${maintenance.estimatedCost.toFixed(2)}</TableCell>
                          <TableCell>{getSeverityBadge(maintenance.priority)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Costos</CardTitle>
                    <CardDescription>Desglose por categoría</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{ amount: { label: "Monto", color: "hsl(var(--chart-1))" } }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costSummaryReport}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="amount"
                          >
                            {costSummaryReport.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de Costos</CardTitle>
                    <CardDescription>Detalle por categoría</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {costSummaryReport.map((item, index) => (
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

              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Costos Mensuales</CardTitle>
                  <CardDescription>Evolución de costos por categoría</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      preventive: { label: "Preventivo", color: "hsl(var(--chart-1))" },
                      corrective: { label: "Correctivo", color: "hsl(var(--chart-2))" },
                      fuel: { label: "Combustible", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-[400px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="preventive" stackId="a" fill="var(--color-preventive)" />
                        <Bar dataKey="corrective" stackId="a" fill="var(--color-corrective)" />
                        <Bar dataKey="fuel" stackId="a" fill="var(--color-fuel)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alertas Activas del Sistema
                  </CardTitle>
                  <CardDescription>Notificaciones que requieren atención</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alertsData.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{alert.title}</h4>
                            {getSeverityBadge(alert.severity)}
                            <Badge variant="outline">{alert.unit}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString("es-ES")}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Resolver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="downtime" className="space-y-4">
              <Card>
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
                      {downtimeReport.map((unit, index) => (
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
