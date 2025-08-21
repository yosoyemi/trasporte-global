// my-app/app/api/anomalies/[id]/resolve/route.ts
import { NextResponse } from "next/server"
import { resolveAnomaly } from "@/lib/actions/anomalies"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json().catch(() => ({}))
    const { actual_repair_cost, resolution_notes, resolution_date } = body ?? {}

    const res = await resolveAnomaly(id, { actual_repair_cost, resolution_notes, resolution_date })
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error ?? "Unknown error" }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: res.data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
