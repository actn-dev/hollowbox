import { NextResponse } from "next/server"
import { monitoringStore } from "@/lib/monitoring-store"

export async function GET() {
  try {
    const stats = await monitoringStore.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching monitoring stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
