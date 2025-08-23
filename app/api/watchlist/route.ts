import { NextResponse } from "next/server"
import { monitoringStore } from "@/lib/monitoring-store"

export async function GET() {
  try {
    const watchlist = await monitoringStore.getWatchlist()
    return NextResponse.json({
      watchlist,
      count: watchlist.length,
    })
  } catch (error) {
    console.error("Error fetching watchlist:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet, status = "passive", notes } = body

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (!wallet.match(/^G[A-Z0-9]{55}$/)) {
      return NextResponse.json({ error: "Invalid Stellar wallet address format" }, { status: 400 })
    }

    if (status !== "passive" && status !== "active") {
      return NextResponse.json({ error: "Status must be 'passive' or 'active'" }, { status: 400 })
    }

    const updatedEntry = await monitoringStore.addWatchlistEntry(wallet, status, "admin", notes)

    return NextResponse.json({
      success: true,
      message: "Wallet added to watchlist successfully",
      entry: updatedEntry,
    })
  } catch (error) {
    console.error("Error adding wallet to watchlist:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    if (!wallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const removedEntry = await monitoringStore.removeWatchlistEntry(wallet)

    if (!removedEntry) {
      return NextResponse.json({ error: "Wallet not found in watchlist" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Wallet removed from watchlist successfully",
      entry: removedEntry,
    })
  } catch (error) {
    console.error("Error removing wallet from watchlist:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
