// app/page.tsx (Server Component)
import Sidebar from "@/components/sidebar"
import { getUnitsSummary } from "@/lib/actions/units"
import { getMaintenanceSummary } from "@/lib/actions/maintenance"
import { getServicesSummary, getMonthlyCosts } from "@/lib/actions/services"
import { getAnomaliesSummary } from "@/lib/actions/anomalies"
import { getFuelTrends } from "@/lib/actions/fuel"
import DashboardClient from "@/components/dashboard-client"

type UnitsSummary = { total: number; active: number; maintenance: number; inactive: number }
type MaintenanceSummary = { pending: number; overdue: number; completed: number }
type ServicesSummary = { total_cost: number }
type AnomaliesMini = { open: number; critical: number; high: number }
type FuelTrend = { month: string; liters: number; cost: number; efficiency: number; records: number }
type MonthlyCost = { month: string; cost: number }
type StatusDatum = { name: string; value: number; color: string }

// Posibles formas en que el backend devuelve anomalías
type AnomaliesServer = {
  open?: number
  high?: number
  critical?: number
  high_severity?: number
  critical_severity?: number
}

export default async function Dashboard() {
  const [
    unitsResult,
    maintenanceResult,
    servicesResult,
    anomaliesResult,
    fuelResult,
    costsResult,
  ] = await Promise.all([
    getUnitsSummary(),
    getMaintenanceSummary(),
    getServicesSummary(),
    getAnomaliesSummary(),
    getFuelTrends(undefined, 6),
    getMonthlyCosts(),
  ])

  const units: UnitsSummary =
    unitsResult.success && unitsResult.data
      ? (unitsResult.data as UnitsSummary)
      : { total: 0, active: 0, maintenance: 0, inactive: 0 }

  const maintenance: MaintenanceSummary =
    maintenanceResult.success && maintenanceResult.data
      ? (maintenanceResult.data as MaintenanceSummary)
      : { pending: 0, overdue: 0, completed: 0 }

  const services: ServicesSummary =
    servicesResult.success && servicesResult.data
      ? (servicesResult.data as ServicesSummary)
      : { total_cost: 0 }

  // Normalizamos el resumen de anomalías a los 3 campos que usa el dashboard.
  const anomaliesRaw: AnomaliesServer | undefined = anomaliesResult.success
    ? (anomaliesResult.data as AnomaliesServer)
    : undefined

  const anomalies: AnomaliesMini = {
    open: anomaliesRaw?.open ?? 0,
    critical: anomaliesRaw?.critical ?? anomaliesRaw?.critical_severity ?? 0,
    high: anomaliesRaw?.high ?? anomaliesRaw?.high_severity ?? 0,
  }

  // ---- Normalización segura del fuel ----
  // getFuelTrends puede devolver filas sin 'cost' ni 'efficiency'.
  const fuelRows = fuelResult.success && Array.isArray(fuelResult.data) ? (fuelResult.data as any[]) : []
  const fuelData: FuelTrend[] = fuelRows.map((r) => ({
    month: String(r.month ?? ""),
    liters: Number(r.liters ?? 0),
    // intenta distintas claves comunes; si no, 0
    cost: Number(r.cost ?? r.fuel_cost ?? r.fuel_cost_usd ?? 0),
    efficiency: Number(r.efficiency ?? r.lph ?? 0),
    records: Number(r.records ?? r.count ?? 0),
  }))

  // ---- Monthly costs (ya compatible) ----
  const monthlyCosts: MonthlyCost[] =
    costsResult.success && Array.isArray(costsResult.data) ? (costsResult.data as MonthlyCost[]) : []

  const statusData: StatusDatum[] = [
    { name: "Activos", value: units.active, color: "hsl(var(--chart-1))" },
    { name: "Mantenimiento", value: units.maintenance, color: "hsl(var(--chart-3))" },
    { name: "Inactivos", value: units.inactive, color: "hsl(var(--chart-4))" },
  ]

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <DashboardClient
        units={units}
        maintenance={maintenance}
        services={services}
        anomalies={anomalies}
        fuelData={fuelData}
        monthlyCosts={monthlyCosts}
        statusData={statusData}
      />
    </div>
  )
}
