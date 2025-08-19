"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Sidebar from "@/components/sidebar"
import { Plus, Search, Fuel, TrendingUp, AlertTriangle, Filter } from "lucide-react"

// Mock data for fuel consumption
const mockFuelConsumption = [
  {
    id: 1,
    unitId: 1,
    unitNumber: "FL-001",
    periodType: "weekly",
    periodStart: "2024-02-05",
    periodEnd: "2024-02-11",
    fuelConsumedLiters: 45.5,
    hoursOperated: 35,
    fuelEfficiency: 1.3,
    costPerLiter: 1.25,
    totalCost: 56.88,
  },
  {
    id: 2,
    unitId: 1,
    unitNumber: "FL-001",
    periodType: "weekly",
    periodStart: "2024-02-12",
    periodEnd: "2024-02-18",
    fuelConsumedLiters: 52.3,
    hoursOperated: 40,
    fuelEfficiency: 1.31,
    costPerLiter: 1.25,
    totalCost: 65.38,
  },
  {
    id: 3,
    unitId: 2,
    unitNumber: "FL-002",
    periodType: "weekly",
    periodStart: "2024-02-05",
    periodEnd: "2024-02-11",
    fuelConsumedLiters: 38.2,
    hoursOperated: 28,
    fuelEfficiency: 1.36,
    costPerLiter: 1.25,
    totalCost: 47.75,
  },
  {
    id: 4,
    unitId: 3,
    unitNumber: "FL-003",
    periodType: "monthly",
    periodStart: "2024-02-01",
    periodEnd: "2024-02-29",
    fuelConsumedLiters: 180.5,
    hoursOperated: 145,
    fuelEfficiency: 1.24,
    costPerLiter: 1.25,
    totalCost: 225.63,
  },
  {
    id: 5,
    unitId: 4,
    unitNumber: "FL-004",
    periodType: "weekly",
    periodStart: "2024-02-12",
    periodEnd: "2024-02-18",
    fuelConsumedLiters: 25.8,
    hoursOperated: 20,
    fuelEfficiency: 1.29,
    costPerLiter: 1.25,
    totalCost: 32.25,
  },
  {
    id: 6,
    unitId: 5,
    unitNumber: "FL-005",
    periodType: "monthly",
    periodStart: "2024-02-01",
    periodEnd: "2024-02-29",
    fuelConsumedLiters: 195.2,
    hoursOperated: 160,
    fuelEfficiency: 1.22,
    costPerLiter: 1.25,
    totalCost: 244.0,
  },
]

// Mock data for trends
const fuelTrendData = [
  { period: "Sem 1", "FL-001": 45.5, "FL-002": 38.2, "FL-003": 42.1, "FL-004": 25.8, "FL-005": 48.7 },
  { period: "Sem 2", "FL-001": 52.3, "FL-002": 41.5, "FL-003": 45.8, "FL-004": 28.2, "FL-005": 51.2 },
  { period: "Sem 3", "FL-001": 48.7, "FL-002": 39.8, "FL-003": 44.2, "FL-004": 26.5, "FL-005": 49.8 },
  { period: "Sem 4", "FL-001": 51.2, "FL-002": 42.1, "FL-003": 46.5, "FL-004": 29.1, "FL-005": 52.3 },
]

const efficiencyData = [
  { unit: "FL-001", efficiency: 1.31, status: "normal" },
  { unit: "FL-002", efficiency: 1.36, status: "good" },
  { unit: "FL-003", efficiency: 1.24, status: "poor" },
  { unit: "FL-004", efficiency: 1.29, status: "normal" },
  { unit: "FL-005", efficiency: 1.22, status: "poor" },
]

const mockUnits = [
  { id: 1, unitNumber: "FL-001", currentHours: 1250 },
  { id: 2, unitNumber: "FL-002", currentHours: 890 },
  { id: 3, unitNumber: "FL-003", currentHours: 2100 },
  { id: 4, unitNumber: "FL-004", currentHours: 450 },
  { id: 5, unitNumber: "FL-005", currentHours: 1800 },
]

export default function FuelPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [periodFilter, setPeriodFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [periodType, setPeriodType] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [fuelConsumed, setFuelConsumed] = useState("")
  const [hoursOperated, setHoursOperated] = useState("")

  const filteredConsumption = mockFuelConsumption.filter((record) => {
    const matchesSearch = record.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPeriod = periodFilter === "all" || record.periodType === periodFilter
    const matchesUnit = unitFilter === "all" || record.unitNumber === unitFilter
    return matchesSearch && matchesPeriod && matchesUnit
  })

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 1.35) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Excelente</Badge>
    } else if (efficiency >= 1.25) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Buena</Badge>
    } else if (efficiency >= 1.15) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Regular</Badge>
    } else {
      return <Badge variant="destructive">Deficiente</Badge>
    }
  }

  const handleRecordFuel = () => {
    if (!selectedUnit || !periodType || !periodStart || !periodEnd || !fuelConsumed || !hoursOperated) return

    const unit = mockUnits.find((u) => u.id.toString() === selectedUnit)
    if (!unit) return

    const efficiency = Number.parseFloat(fuelConsumed) / Number.parseFloat(hoursOperated)

    console.log("Registrando consumo de combustible:", {
      unit: unit.unitNumber,
      periodType,
      periodStart,
      periodEnd,
      fuelConsumed: Number.parseFloat(fuelConsumed),
      hoursOperated: Number.parseFloat(hoursOperated),
      efficiency: efficiency.toFixed(2),
    })

    // Reset form
    setIsRecordDialogOpen(false)
    setSelectedUnit("")
    setPeriodType("")
    setPeriodStart("")
    setPeriodEnd("")
    setFuelConsumed("")
    setHoursOperated("")
  }

  const totalFuelConsumed = mockFuelConsumption.reduce((sum, record) => sum + record.fuelConsumedLiters, 0)
  const totalCost = mockFuelConsumption.reduce((sum, record) => sum + record.totalCost, 0)
  const averageEfficiency =
    mockFuelConsumption.reduce((sum, record) => sum + record.fuelEfficiency, 0) / mockFuelConsumption.length
  const poorEfficiencyUnits = efficiencyData.filter((unit) => unit.status === "poor").length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Control de Combustible</h1>
              <p className="text-muted-foreground mt-1">Seguimiento y análisis del consumo de combustible</p>
            </div>
            <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Consumo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Consumo de Combustible</DialogTitle>
                  <DialogDescription>Registra el consumo para un período específico</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unidad</Label>
                    <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodType">Tipo de Período</Label>
                    <Select value={periodType} onValueChange={setPeriodType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="periodStart">Fecha Inicio</Label>
                      <Input
                        id="periodStart"
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodEnd">Fecha Fin</Label>
                      <Input
                        id="periodEnd"
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fuelConsumed">Combustible (L)</Label>
                      <Input
                        id="fuelConsumed"
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={fuelConsumed}
                        onChange={(e) => setFuelConsumed(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hoursOperated">Horas Operadas</Label>
                      <Input
                        id="hoursOperated"
                        type="number"
                        placeholder="0"
                        value={hoursOperated}
                        onChange={(e) => setHoursOperated(e.target.value)}
                      />
                    </div>
                  </div>

                  {fuelConsumed && hoursOperated && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Eficiencia calculada:</p>
                      <p className="text-lg font-bold">
                        {(Number.parseFloat(fuelConsumed) / Number.parseFloat(hoursOperated)).toFixed(2)} L/h
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={handleRecordFuel}>
                      Registrar
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsRecordDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalFuelConsumed.toFixed(1)}L</div>
                <p className="text-xs text-muted-foreground">Período actual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                <div className="text-lg">$</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Inversión en combustible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eficiencia Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageEfficiency.toFixed(2)} L/h</div>
                <p className="text-xs text-muted-foreground">Flota completa</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{poorEfficiencyUnits}</div>
                <p className="text-xs text-muted-foreground">Unidades con baja eficiencia</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="records" className="space-y-4">
            <TabsList>
              <TabsTrigger value="records">Registros</TabsTrigger>
              <TabsTrigger value="trends">Tendencias</TabsTrigger>
              <TabsTrigger value="efficiency">Eficiencia</TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por unidad..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los períodos</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las unidades</SelectItem>
                        {mockUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.unitNumber}>
                            {unit.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Consumption Records Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Registros de Consumo</CardTitle>
                  <CardDescription>{filteredConsumption.length} registros encontrados</CardDescription>
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
                      {filteredConsumption.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.unitNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.periodType === "weekly" ? "Semanal" : "Mensual"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{new Date(record.periodStart).toLocaleDateString("es-ES")}</div>
                              <div className="text-muted-foreground">
                                {new Date(record.periodEnd).toLocaleDateString("es-ES")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Fuel className="h-3 w-3 text-muted-foreground" />
                              {record.fuelConsumedLiters.toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell>{record.hoursOperated}h</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{record.fuelEfficiency.toFixed(2)} L/h</span>
                              {getEfficiencyBadge(record.fuelEfficiency)}
                            </div>
                          </TableCell>
                          <TableCell>${record.totalCost.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia de Consumo por Unidad</CardTitle>
                    <CardDescription>Consumo de combustible semanal por unidad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        "FL-001": { label: "FL-001", color: "hsl(var(--chart-1))" },
                        "FL-002": { label: "FL-002", color: "hsl(var(--chart-2))" },
                        "FL-003": { label: "FL-003", color: "hsl(var(--chart-3))" },
                        "FL-004": { label: "FL-004", color: "hsl(var(--chart-4))" },
                        "FL-005": { label: "FL-005", color: "hsl(var(--chart-5))" },
                      }}
                      className="h-[400px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={fuelTrendData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="FL-001" stroke="var(--color-FL-001)" strokeWidth={2} />
                          <Line type="monotone" dataKey="FL-002" stroke="var(--color-FL-002)" strokeWidth={2} />
                          <Line type="monotone" dataKey="FL-003" stroke="var(--color-FL-003)" strokeWidth={2} />
                          <Line type="monotone" dataKey="FL-004" stroke="var(--color-FL-004)" strokeWidth={2} />
                          <Line type="monotone" dataKey="FL-005" stroke="var(--color-FL-005)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="efficiency">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Eficiencia por Unidad</CardTitle>
                    <CardDescription>Comparativa de eficiencia de combustible</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        efficiency: { label: "Eficiencia (L/h)", color: "hsl(var(--chart-1))" },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={efficiencyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="unit" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="efficiency" fill="var(--color-efficiency)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alertas de Eficiencia</CardTitle>
                    <CardDescription>Unidades que requieren atención</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {efficiencyData
                        .filter((unit) => unit.efficiency < 1.25)
                        .map((unit) => (
                          <div key={unit.unit} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="h-5 w-5 text-orange-500" />
                              <div>
                                <div className="font-medium">{unit.unit}</div>
                                <div className="text-sm text-muted-foreground">
                                  Eficiencia: {unit.efficiency.toFixed(2)} L/h
                                </div>
                              </div>
                            </div>
                            <Badge variant="destructive">Revisar</Badge>
                          </div>
                        ))}
                      {efficiencyData.filter((unit) => unit.efficiency < 1.25).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                          <p>Todas las unidades tienen eficiencia aceptable</p>
                        </div>
                      )}
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
