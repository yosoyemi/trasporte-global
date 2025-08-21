// my-app/app/api/anomalies/route.ts
import { NextResponse } from "next/server"
import { getAnomalies } from "@/lib/actions/anomalies"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const unit_id = searchParams.get("unit_id") ?? undefined
  const status = searchParams.get("status") ?? undefined
  const severity = searchParams.get("severity") ?? undefined
  const date_from = searchParams.get("date_from") ?? undefined
  const date_to = searchParams.get("date_to") ?? undefined
  const search = searchParams.get("search") ?? undefined

  const res = await getAnomalies({ unit_id, status, severity, date_from, date_to, search })
  if (!res.success) {
    return NextResponse.json({ success: false, error: res.error ?? "Unknown error" }, { status: 500 })
  }
  return NextResponse.json({ success: true, data: res.data })
}
