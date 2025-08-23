import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

async function getUserTier(walletAddress: string): Promise<number> {
  try {
    console.log("Getting tier for wallet:", walletAddress)

    // Special handling for test wallets
    if (walletAddress.startsWith("GC3XYCFX")) {
      console.log("Test wallet detected, assigning Tier 1")
      return 1
    }

    // Check profit tracker entries
    const profitResult = await sql`
      SELECT balance FROM profit_tracker_entries 
      WHERE wallet_address = ${walletAddress} 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    if (profitResult.length > 0) {
      const balance = Number.parseFloat(profitResult[0].balance)
      console.log("Found balance in profit tracker:", balance)

      if (balance >= 100000) return 3 // Tier 3: 100k+
      if (balance >= 10000) return 2 // Tier 2: 10k+
      if (balance >= 1000) return 1 // Tier 1: 1k+
    }

    // Check game rewards balance
    const rewardsResult = await sql`
      SELECT COALESCE(SUM(tokens_earned), 0) as total_tokens
      FROM game_rewards 
      WHERE wallet_address = ${walletAddress}
    `

    if (rewardsResult.length > 0) {
      const totalTokens = Number.parseFloat(rewardsResult[0].total_tokens || "0")
      console.log("Found total tokens in game rewards:", totalTokens)

      if (totalTokens >= 100000) return 3
      if (totalTokens >= 10000) return 2
      if (totalTokens >= 1000) return 1
    }

    console.log("No balance found, defaulting to Tier 0")
    return 0 // Default tier
  } catch (error) {
    console.error("Error getting user tier:", error)
    return 0
  }
}

function getTierScans(tier: number): number {
  switch (tier) {
    case 3:
      return 10
    case 2:
      return 7
    case 1:
      return 5
    default:
      return 3
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    console.log("Getting stats for wallet:", walletAddress)

    // Get user tier
    const userTier = await getUserTier(walletAddress)
    const maxScans = getTierScans(userTier)

    console.log(`User tier: ${userTier}, Max scans: ${maxScans}`)

    // Get today's date in UTC
    const today = new Date().toISOString().split("T")[0]

    // Get or create today's stats
    let statsResult = await sql`
      SELECT * FROM signal_hunt_stats 
      WHERE wallet_address = ${walletAddress} 
      AND DATE(created_at) = ${today}
      ORDER BY created_at DESC 
      LIMIT 1
    `

    let stats
    if (statsResult.length === 0) {
      // Create new stats for today
      console.log("Creating new stats for today")
      await sql`
        INSERT INTO signal_hunt_stats (
          wallet_address, scans_used, max_scans, signals_found, 
          session_tokens, perfect_rhythms, lore_unlocked, created_at
        ) VALUES (
          ${walletAddress}, 0, ${maxScans}, 0, 0, 0, 0, NOW()
        )
      `

      statsResult = await sql`
        SELECT * FROM signal_hunt_stats 
        WHERE wallet_address = ${walletAddress} 
        AND DATE(created_at) = ${today}
        ORDER BY created_at DESC 
        LIMIT 1
      `
    } else {
      // Update max_scans based on current tier
      console.log("Updating max_scans for existing stats")
      await sql`
        UPDATE signal_hunt_stats 
        SET max_scans = ${maxScans}
        WHERE wallet_address = ${walletAddress} 
        AND DATE(created_at) = ${today}
      `
      statsResult[0].max_scans = maxScans
    }

    stats = statsResult[0]

    // Get found signals
    const signalsResult = await sql`
      SELECT * FROM signal_hunt_found_signals 
      WHERE wallet_address = ${walletAddress}
      ORDER BY created_at DESC
    `

    // Calculate time until reset
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    const timeUntilReset = tomorrow.getTime() - now.getTime()

    const response = {
      scansUsed: stats.scans_used,
      maxScans: stats.max_scans,
      signalsFound: stats.signals_found,
      sessionTokens: stats.session_tokens,
      perfectRhythms: stats.perfect_rhythms,
      loreUnlocked: stats.lore_unlocked,
      foundSignals: signalsResult,
      userTier,
      timeUntilReset,
      canScan: stats.scans_used < stats.max_scans,
    }

    console.log("Returning stats:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error getting signal hunt stats:", error)
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 })
  }
}
