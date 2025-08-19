// lib/constants/maintenance.ts
export const MAINTENANCE_INTERVALS = [250, 500, 750, 1000, 2000, 3000] as const
export type MaintenanceInterval = (typeof MAINTENANCE_INTERVALS)[number]
