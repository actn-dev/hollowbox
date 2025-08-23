import { NextResponse } from "next/server"
import { monitoringStore } from "@/lib/monitoring-store"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet, status } = body

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (status !== "passive" && status !== "active") {
      return NextResponse.json({ error: "Status must be 'passive' or 'active'" }, { status: 400 })
    }

    const updatedEntry = await monitoringStore.updateWatchlistEntry(wallet, status)

    if (!updatedEntry) {
      return NextResponse.json({ error: "Wallet not found in watchlist" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Wallet status updated to ${status}`,
      entry: updatedEntry,
    })
  } catch (error) {
    console.error("Error updating watchlist entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
