"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sidebar } from "@/components/sidebar"
import { ArrowLeft, Edit, Clock, Wrench, AlertTriangle, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data for unit details
const mockUnit = {
  id: 1,
  unitNumber: "FL-001",
  brand: "Toyota",
  model: "8FGU25",
  serialNumber: "TY2023001",
  currentHours: 1250,
  status: "active",
  purchaseDate: "2023-01-15",
  lastServiceHours: 1000,
  nextServiceHours: 1500,
  nextServiceType: "500h",
  capacity: "2500 kg",
  fuelType: "GLP",
  year: "2023",
  location: "Almacén Principal",
}

const mockServiceHistory = [
  {
    id: 1,
    date: "2024-01-15",
    type: "preventive",
    serviceType: "1000h",
    hours: 1000,
    description: "Cambio de aceite, filtros y revisión general",
    cost: 285.5,
    technician: "Carlos Méndez",
  },
  {
    id: 2,
    date: "2024-01-20",
    type: "corrective",
    serviceType: null,
    hours: 1050,
    description: "Reparación de sistema hidráulico - fuga en cilindro principal",
    cost: 450.75,
    technician: "Ana García",
  },
  {
    id: 3,
    date: "2023-10-10",
    type: "preventive",
    serviceType: "500h",
    hours: 500,
    description: "Mantenimiento preventivo 500h",
    cost: 180.0,
    technician: "Luis Rodríguez",
  },
]

const mockAnomalies = [
  {
    id: 1,
    date: "2024-01-25",
    description: "Ruido extraño en el motor al acelerar",
    severity: "medium",
    status: "open",
    reportedBy: "Juan Pérez",
  },
  {
    id: 2,
    date: "2024-01-10",
    description: "Luces de trabajo intermitentes",
    severity: "low",
    status: "resolved",
    reportedBy: "María González",
  },
]

export default function UnitDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Mantenimiento</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactivo</Badge>
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-mono text-foreground">{mockUnit.unitNumber}</h1>
                <p className="text-muted-foreground mt-1">
                  {mockUnit.brand} {mockUnit.model} - {mockUnit.serialNumber}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(mockUnit.status)}
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marca</label>
                    <p className="font-medium">{mockUnit.brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                    <p className="font-medium">{mockUnit.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Número de Serie</label>
                    <p className="font-mono text-sm">{mockUnit.serialNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Año</label>
                    <p className="font-medium">{mockUnit.year}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Capacidad</label>
                    <p className="font-medium">{mockUnit.capacity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Combustible</label>
                    <p className="font-medium">{mockUnit.fuelType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fecha de Compra</label>
                    <p className="font-medium">{new Date(mockUnit.purchaseDate).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                    <p className="font-medium">{mockUnit.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado Operativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Horómetro Actual</label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xl font-bold">{mockUnit.currentHours.toLocaleString()}h</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <div className="mt-1">{getStatusBadge(mockUnit.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Último Servicio</label>
                    <p className="font-medium">{mockUnit.lastServiceHours.toLocaleString()}h</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Próximo Servicio</label>
                    <div>
                      <p className="font-medium">{mockUnit.nextServiceHours.toLocaleString()}h</p>
                      <p className="text-sm text-muted-foreground">{mockUnit.nextServiceType}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Historial de Servicios
              </CardTitle>
              <CardDescription>Registro completo de mantenimientos y reparaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horómetro</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Costo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockServiceHistory.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{new Date(service.date).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell>
                        <div>
                          <Badge variant={service.type === "preventive" ? "default" : "secondary"}>
                            {service.type === "preventive" ? "Preventivo" : "Correctivo"}
                          </Badge>
                          {service.serviceType && (
                            <div className="text-xs text-muted-foreground mt-1">{service.serviceType}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{service.hours.toLocaleString()}h</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate" title={service.description}>
                          {service.description}
                        </p>
                      </TableCell>
                      <TableCell>{service.technician}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {service.cost.toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Anomalies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomalías Reportadas
              </CardTitle>
              <CardDescription>Reportes de problemas y observaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnomalies.map((anomaly) => (
                  <div key={anomaly.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={anomaly.status === "open" ? "destructive" : "default"}>
                            {anomaly.status === "open" ? "Abierta" : "Resuelta"}
                          </Badge>
                          {getSeverityBadge(anomaly.severity)}
                        </div>
                        <p className="font-medium mb-1">{anomaly.description}</p>
                        <div className="text-sm text-muted-foreground">
                          Reportado por {anomaly.reportedBy} el {new Date(anomaly.date).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
