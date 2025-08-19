// app/units/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Sidebar from "@/components/sidebar"
import { Eye, Edit, Truck, Clock, Wrench } from "lucide-react"
import { getUnits, getUnitsSummary } from "@/lib/actions/units"
import { UnitsFilters } from "@/components/units-filters"
import { AddUnitDialog } from "@/components/add-unit-dialog"
import Link from "next/link"

type RawSearchParams = Record<string, string | string[] | undefined>

type UnitRow = {
  id: string | number
  unit_number: string
  brand: string
  model: string
  serial_number: string
  current_hours: number
  status: "active" | "maintenance" | "inactive" | string
  next_service_hours: number | null
}

type Summary = {
  total: number
  active: number
  maintenance: number
  inactive: number
}

export default async function UnitsPage(props: { searchParams?: Promise<RawSearchParams> }) {
  // Normaliza searchParams (Next 15 lo entrega como Promise)
  const sp: RawSearchParams = await (props.searchParams ?? Promise.resolve({} as RawSearchParams))

  const search = typeof sp.search === "string" ? sp.search : ""
  const status = typeof sp.status === "string" ? sp.status : "all"
  const fuel_type = typeof sp.fuel_type === "string" ? sp.fuel_type : "all"
  const brand = typeof sp.brand === "string" ? sp.brand : "all"

  const [unitsResult, summaryResult] = await Promise.all([
    getUnits({ status, fuel_type, brand, search }),
    getUnitsSummary(),
  ])

  const units: UnitRow[] = (unitsResult.success ? unitsResult.data : []) as UnitRow[]
  const summary: Summary = summaryResult.success
    ? (summaryResult.data as Summary)
    : { total: 0, active: 0, maintenance: 0, inactive: 0 }

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

  const getServiceStatus = (currentHours: number, nextServiceHours: number | null) => {
    if (!nextServiceHours) return <Badge variant="outline">Sin programar</Badge>
    const hoursUntilService = nextServiceHours - currentHours
    if (hoursUntilService <= 0) return <Badge variant="destructive">Vencido</Badge>
    if (hoursUntilService <= 50)
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Próximo</Badge>
    return <Badge variant="outline">Al día</Badge>
  }

  const unitsNeedingService = units.filter(
    (u) => u.next_service_hours && u.next_service_hours - u.current_hours <= 50,
  ).length

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono text-foreground">Gestión de Unidades</h1>
              <p className="text-muted-foreground mt-1">Administra las fichas técnicas de los montacargas</p>
            </div>
            <AddUnitDialog />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activas</CardTitle>
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.maintenance}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos Servicios</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unitsNeedingService}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <UnitsFilters />

          {/* Units Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Unidades</CardTitle>
              <CardDescription>{units.length} unidades encontradas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Marca/Modelo</TableHead>
                    <TableHead>Serie</TableHead>
                    <TableHead>Horómetro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próximo Servicio</TableHead>
                    <TableHead>Estado Servicio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.unit_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{unit.brand}</div>
                          <div className="text-sm text-muted-foreground">{unit.model}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{unit.serial_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {unit.current_hours.toLocaleString()}h
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(unit.status)}</TableCell>
                      <TableCell>
                        {unit.next_service_hours ? (
                          <div>
                            <div className="font-medium">{unit.next_service_hours.toLocaleString()}h</div>
                            <div className="text-sm text-muted-foreground">
                              {unit.next_service_hours - unit.current_hours > 0
                                ? `En ${unit.next_service_hours - unit.current_hours}h`
                                : "Vencido"}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Sin programar</div>
                        )}
                      </TableCell>
                      <TableCell>{getServiceStatus(unit.current_hours, unit.next_service_hours)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/units/${unit.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
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
