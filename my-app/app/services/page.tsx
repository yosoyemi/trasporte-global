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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"
import { Plus, Search, Wrench, DollarSign, Clock, User, Filter } from "lucide-react"

// Mock data for services
const mockServices = [
  {
    id: 1,
    unitId: 1,
    unitNumber: "FL-001",
    serviceType: "corrective",
    serviceDate: "2024-02-15",
    serviceHours: 1200,
    description:
      "Reparación de sistema hidráulico - fuga en cilindro principal. Se reemplazó sello principal y se verificó presión del sistema.",
    costUsd: 450.75,
    technician: "Carlos Méndez",
    partsUsed: "Sello hidráulico principal, aceite hidráulico (5L)",
    severity: "high",
    downtime: 4,
    status: "completed",
  },
  {
    id: 2,
    unitId: 2,
    unitNumber: "FL-002",
    serviceType: "corrective",
    serviceDate: "2024-02-10",
    serviceHours: 850,
    description: "Cambio de llantas traseras por desgaste excesivo y desalineación. Se realizó alineación completa.",
    costUsd: 320.5,
    technician: "Ana García",
    partsUsed: "2 llantas traseras, balanceado y alineación",
    severity: "medium",
    downtime: 2,
    status: "completed",
  },
  {
    id: 3,
    unitId: 3,
    unitNumber: "FL-003",
    serviceType: "corrective",
    serviceDate: "2024-02-08",
    serviceHours: 2050,
    description: "Reparación de frenos traseros con respuesta lenta. Se reemplazaron pastillas y se ajustó sistema.",
    costUsd: 280.0,
    technician: "Luis Rodríguez",
    partsUsed: "Pastillas de freno traseras, líquido de frenos",
    severity: "high",
    downtime: 3,
    status: "completed",
  },
  {
    id: 4,
    unitId: 4,
    unitNumber: "FL-004",
    serviceType: "corrective",
    serviceDate: "2024-02-05",
    serviceHours: 420,
    description: "Reparación de sistema eléctrico - luces de trabajo intermitentes. Se reemplazó cableado defectuoso.",
    costUsd: 125.3,
    technician: "Roberto Silva",
    partsUsed: "Cable eléctrico, conectores, fusibles",
    severity: "low",
    downtime: 1,
    status: "completed",
  },
  {
    id: 5,
    unitId: 1,
    unitNumber: "FL-001",
    serviceType: "corrective",
    serviceDate: "2024-02-20",
    serviceHours: 1250,
    description: "Vibración excesiva en el volante durante operación. Diagnóstico en proceso.",
    costUsd: 0,
    technician: "Carlos Méndez",
    partsUsed: "",
    severity: "medium",
    downtime: 0,
    status: "in_progress",
  },
]

const mockUnits = [
  { id: 1, unitNumber: "FL-001", currentHours: 1250 },
  { id: 2, unitNumber: "FL-002", currentHours: 890 },
  { id: 3, unitNumber: "FL-003", currentHours: 2100 },
  { id: 4, unitNumber: "FL-004", currentHours: 450 },
  { id: 5, unitNumber: "FL-005", currentHours: 1800 },
]

const technicians = ["Carlos Méndez", "Ana García", "Luis Rodríguez", "Roberto Silva", "María González", "Juan Pérez"]

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [serviceDescription, setServiceDescription] = useState("")
  const [serviceCost, setServiceCost] = useState("")
  const [selectedTechnician, setSelectedTechnician] = useState("")
  const [partsUsed, setPartsUsed] = useState("")
  const [severity, setSeverity] = useState("")

  const filteredServices = mockServices.filter((service) => {
    const matchesSearch =
      service.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.technician.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || service.serviceType === typeFilter
    const matchesStatus = statusFilter === "all" || service.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En Proceso</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>
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

  const handleCreateService = () => {
    if (!selectedUnit || !serviceDescription) return

    const unit = mockUnits.find((u) => u.id.toString() === selectedUnit)
    if (!unit) return

    console.log("Creando servicio correctivo:", {
      unit: unit.unitNumber,
      description: serviceDescription,
      cost: serviceCost,
      technician: selectedTechnician,
      parts: partsUsed,
      severity: severity,
    })

    // Reset form
    setIsServiceDialogOpen(false)
    setSelectedUnit("")
    setServiceDescription("")
    setServiceCost("")
    setSelectedTechnician("")
    setPartsUsed("")
    setSeverity("")
  }

  const totalServices = mockServices.length
  const completedServices = mockServices.filter((s) => s.status === "completed").length
  const inProgressServices = mockServices.filter((s) => s.status === "in_progress").length
  const totalCost = mockServices.reduce((sum, service) => sum + service.costUsd, 0)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Servicios Correctivos</h1>
              <p className="text-muted-foreground mt-1">Registro y seguimiento de reparaciones e intervenciones</p>
            </div>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Registrar Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Servicio Correctivo</DialogTitle>
                  <DialogDescription>Documenta una reparación o intervención correctiva</DialogDescription>
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
                              {unit.unitNumber} - {unit.currentHours.toLocaleString()}h
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción del Problema y Solución</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe detalladamente el problema encontrado y la solución aplicada..."
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="technician">Técnico Responsable</Label>
                      <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar técnico" />
                        </SelectTrigger>
                        <SelectContent>
                          {technicians.map((tech) => (
                            <SelectItem key={tech} value={tech}>
                              {tech}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Costo (USD)</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={serviceCost}
                        onChange={(e) => setServiceCost(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parts">Partes y Materiales Utilizados</Label>
                    <Textarea
                      id="parts"
                      placeholder="Lista las partes, materiales y consumibles utilizados..."
                      value={partsUsed}
                      onChange={(e) => setPartsUsed(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={handleCreateService}>
                      Registrar Servicio
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => setIsServiceDialogOpen(false)}
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
                <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServices}</div>
                <p className="text-xs text-muted-foreground">Servicios registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completados</CardTitle>
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedServices}</div>
                <p className="text-xs text-muted-foreground">Reparaciones finalizadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{inProgressServices}</div>
                <p className="text-xs text-muted-foreground">Servicios activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Inversión en reparaciones</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="services" className="space-y-4">
            <TabsList>
              <TabsTrigger value="services">Servicios</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="space-y-4">
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
                          placeholder="Buscar por unidad, descripción o técnico..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="corrective">Correctivo</SelectItem>
                        <SelectItem value="emergency">Emergencia</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="in_progress">En Proceso</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Services Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Servicios Correctivos</CardTitle>
                  <CardDescription>{filteredServices.length} servicios encontrados</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Técnico</TableHead>
                        <TableHead>Severidad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Tiempo Parada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{new Date(service.serviceDate).toLocaleDateString("es-ES")}</TableCell>
                          <TableCell className="font-medium">{service.unitNumber}</TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate" title={service.description}>
                              {service.description}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {service.technician}
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(service.severity)}</TableCell>
                          <TableCell>{getStatusBadge(service.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {service.costUsd.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {service.downtime > 0 ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-orange-500" />
                                {service.downtime}h
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Servicios por Severidad</CardTitle>
                    <CardDescription>Distribución de servicios según criticidad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["critical", "high", "medium", "low"].map((sev) => {
                        const count = mockServices.filter((s) => s.severity === sev).length
                        const percentage = (count / mockServices.length) * 100
                        return (
                          <div key={sev} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(sev)}
                              <span className="text-sm">{count} servicios</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Técnicos más Activos</CardTitle>
                    <CardDescription>Servicios realizados por técnico</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {technicians.slice(0, 4).map((tech) => {
                        const count = mockServices.filter((s) => s.technician === tech).length
                        const totalCost = mockServices
                          .filter((s) => s.technician === tech)
                          .reduce((sum, s) => sum + s.costUsd, 0)
                        return (
                          <div key={tech} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{tech}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{count} servicios</div>
                              <div className="text-xs text-muted-foreground">${totalCost.toFixed(2)}</div>
                            </div>
                          </div>
                        )
                      })}
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
