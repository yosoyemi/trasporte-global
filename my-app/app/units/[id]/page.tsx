// app/units/[id]/page.tsx

import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Wrench } from "lucide-react"
import Link from "next/link"
import { getUnitById } from "@/lib/actions/units"
import EditUnitDialog from "@/components/edit-unit-dialog"
import UpdateHours from "@/components/update-hours"
import ChangeUnitImage from "@/components/change-unit-image"
import UnitImage from "@/components/unit-image"

// Nota Next.js 15: `params` es una Promise en PageProps.
type Params = { id: string }

const getStatusBadge = (st: string) => {
  switch (st) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
    case "maintenance":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Mantenimiento</Badge>
    case "inactive":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactivo</Badge>
    default:
      return <Badge variant="secondary">{st}</Badge>
  }
}

export default async function UnitDetailsPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const unitRes = await getUnitById(id)

  if (!unitRes.success || !unitRes.data) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/units">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold">Unidad no encontrada</h1>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const unit = unitRes.data

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/units">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <div className="h-16 w-24 overflow-hidden rounded-md border bg-muted">
                  <UnitImage
                    src={unit.image_url || undefined}
                    alt={`${unit.unit_number}`}
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-mono text-foreground">{unit.unit_number}</h1>
                  <p className="text-muted-foreground mt-1">
                    {unit.brand} {unit.model} — <span className="font-mono text-sm">{unit.serial_number}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(unit.status)}
              <EditUnitDialog unit={unit} />
            </div>
          </div>

          {/* Cambiar imagen */}
          <ChangeUnitImage unitId={unit.id} currentUrl={unit.image_url} />

          {/* Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Marca</div>
                    <div className="font-medium">{unit.brand}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Modelo</div>
                    <div className="font-medium">{unit.model}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Serie</div>
                    <div className="font-mono text-sm">{unit.serial_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Año</div>
                    <div className="font-medium">{unit.year ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Capacidad (kg)</div>
                    <div className="font-medium">{unit.capacity_kg?.toLocaleString() ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Combustible</div>
                    <div className="font-medium">{unit.fuel_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Ubicación</div>
                    <div className="font-medium">{unit.location ?? "-"}</div>
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
                    <div className="text-sm text-muted-foreground">Horómetro Actual</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="text-xl font-bold">{Number(unit.current_hours || 0).toLocaleString()}h</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Próximo Servicio</div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div className="font-medium">
                        {unit.next_service_hours != null
                          ? `${unit.next_service_hours.toLocaleString()}h`
                          : "Sin programar"}
                      </div>
                    </div>
                  </div>
                </div>

                <UpdateHours unitId={unit.id} currentHours={unit.current_hours ?? 0} />
              </CardContent>
            </Card>
          </div>

          {/* Placeholder secciones (sin datos aún) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Historial de Servicios
              </CardTitle>
              <CardDescription>No hay registros todavía</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </div>
      </main>
    </div>
  )
}
