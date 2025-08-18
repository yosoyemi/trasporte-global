"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
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
import { Sidebar } from "@/components/sidebar"
import { Plus, Search, AlertTriangle, User, Clock, DollarSign, Filter } from "lucide-react"

// Mock data for anomalies
const mockAnomalies = [
  {
    id: 1,
    unitId: 1,
    unitNumber: "FL-001",
    reportDate: "2024-02-25",
    reportedBy: "Juan Pérez",
    anomalyDescription: "Ruido extraño en el motor al acelerar, posible problema en la transmisión",
    severity: "medium",
    status: "open",
    estimatedCostUsd: 300.0,
    actualCostUsd: null,
    resolutionDescription: null,
    resolvedAt: null,
  },
  {
    id: 2,
    unitId: 2,
    unitNumber: "FL-002",
    reportDate: "2024-02-28",
    reportedBy: "María González",
    anomalyDescription: "Fuga de aceite hidráulico en el área del mástil, requiere revisión urgente",
    severity: "high",
    status: "in_progress",
    estimatedCostUsd: 500.0,
    actualCostUsd: null,
    resolutionDescription: "Se identificó sello defectuoso en cilindro principal. Repuesto en camino.",
    resolvedAt: null,
  },
  {
    id: 3,
    unitId: 3,
    unitNumber: "FL-003",
    reportDate: "2024-02-02",
    reportedBy: "Carlos Rodríguez",
    anomalyDescription: "Frenos traseros con respuesta lenta, requiere revisión urgente del sistema",
    severity: "high",
    status: "resolved",
    estimatedCostUsd: 250.0,
    actualCostUsd: 280.0,
    resolutionDescription: "Se reemplazaron pastillas de freno y se ajustó el sistema completo. Pruebas exitosas.",
    resolvedAt: "2024-02-08T14:30:00Z",
  },
  {
    id: 4,
    unitId: 4,
    unitNumber: "FL-004",
    reportDate: "2024-02-05",
    reportedBy: "Ana López",
    anomalyDescription: "Luces de trabajo intermitentes, posible problema eléctrico en el cableado",
    severity: "low",
    status: "resolved",
    estimatedCostUsd: 80.0,
    actualCostUsd: 125.3,
    resolutionDescription:
      "Se reemplazó cableado defectuoso y conectores. Sistema eléctrico funcionando correctamente.",
    resolvedAt: "2024-02-10T11:15:00Z",
  },
  {
    id: 5,
    unitId: 5,
    unitNumber: "FL-005",
    reportDate: "2024-02-08",
    reportedBy: "Roberto Silva",
    anomalyDescription: "Vibración excesiva en el volante durante operación, afecta la maniobrabilidad",
    severity: "medium",
    status: "open",
    estimatedCostUsd: 200.0,
    actualCostUsd: null,
    resolutionDescription: null,
    resolvedAt: null,
  },
]

const mockUnits = [
  { id: 1, unitNumber: "FL-001" },
  { id: 2, unitNumber: "FL-002" },
  { id: 3, unitNumber: "FL-003" },
  { id: 4, unitNumber: "FL-004" },
  { id: 5, unitNumber: "FL-005" },
]

const operators = ["Juan Pérez", "María González", "Carlos Rodríguez", "Ana López", "Roberto Silva", "Luis Martín"]

export default function AnomaliesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [reportedBy, setReportedBy] = useState("")
  const [anomalyDescription, setAnomalyDescription] = useState("")
  const [severity, setSeverity] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")

  const filteredAnomalies = mockAnomalies.filter((anomaly) => {
    const matchesSearch =
      anomaly.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomaly.anomalyDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomaly.reportedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || anomaly.status === statusFilter
    const matchesSeverity = severityFilter === "all" || anomaly.severity === severityFilter
    return matchesSearch && matchesStatus && matchesSeverity
  })

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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Crítica</Badge>
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Alta</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Media</Badge>
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Baja</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const handleReportAnomaly = () => {
    if (!selectedUnit || !reportedBy || !anomalyDescription || !severity) return

    const unit = mockUnits.find((u) => u.id.toString() === selectedUnit)
    if (!unit) return

    console.log("Reportando anomalía:", {
      unit: unit.unitNumber,
      reportedBy,
      description: anomalyDescription,
      severity,
      estimatedCost: estimatedCost ? Number.parseFloat(estimatedCost) : 0,
    })

    // Reset form
    setIsReportDialogOpen(false)
    setSelectedUnit("")
    setReportedBy("")
    setAnomalyDescription("")
    setSeverity("")
    setEstimatedCost("")
  }

  const totalAnomalies = mockAnomalies.length
  const openAnomalies = mockAnomalies.filter((a) => a.status === "open").length
  const inProgressAnomalies = mockAnomalies.filter((a) => a.status === "in_progress").length
  const criticalAnomalies = mockAnomalies.filter((a) => a.severity === "critical" || a.severity === "high").length

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
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Reportar Anomalía
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Reportar Nueva Anomalía</DialogTitle>
                  <DialogDescription>Documenta un problema o observación operativa</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="reportedBy">Reportado Por</Label>
                      <Select value={reportedBy} onValueChange={setReportedBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar operador" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((operator) => (
                            <SelectItem key={operator} value={operator}>
                              {operator}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción de la Anomalía</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe detalladamente el problema observado, síntomas y condiciones..."
                      value={anomalyDescription}
                      onChange={(e) => setAnomalyDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severidad</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar severidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCost">Costo Estimado (USD)</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={handleReportAnomaly}>
                      Reportar Anomalía
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsReportDialogOpen(false)}
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
                <CardTitle className="text-sm font-medium">Total Anomalías</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAnomalies}</div>
                <p className="text-xs text-muted-foreground">Reportes registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abiertas</CardTitle>
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{openAnomalies}</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{inProgressAnomalies}</div>
                <p className="text-xs text-muted-foreground">Siendo atendidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Críticas/Altas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{criticalAnomalies}</div>
                <p className="text-xs text-muted-foreground">Prioridad alta</p>
              </CardContent>
            </Card>
          </div>

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
                      placeholder="Buscar por unidad, descripción o reportador..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="open">Abiertas</SelectItem>
                    <SelectItem value="in_progress">En Proceso</SelectItem>
                    <SelectItem value="resolved">Resueltas</SelectItem>
                    <SelectItem value="closed">Cerradas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las severidades</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Anomalies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Anomalías</CardTitle>
              <CardDescription>{filteredAnomalies.length} anomalías encontradas</CardDescription>
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
                  {filteredAnomalies.map((anomaly) => (
                    <TableRow key={anomaly.id}>
                      <TableCell>{new Date(anomaly.reportDate).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="font-medium">{anomaly.unitNumber}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate" title={anomaly.anomalyDescription}>
                          {anomaly.anomalyDescription}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {anomaly.reportedBy}
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(anomaly.severity)}</TableCell>
                      <TableCell>{getStatusBadge(anomaly.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {anomaly.actualCostUsd
                            ? anomaly.actualCostUsd.toFixed(2)
                            : anomaly.estimatedCostUsd?.toFixed(2) || "0.00"}
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
