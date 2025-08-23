import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("=== BALANCE ROUTE START ===")

    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    console.log("Balance request for wallet:", wallet_address)

    if (!wallet_address) {
      console.log("No wallet address provided")
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    console.log("Fetching balance data...")

    // Get total earned
    console.log("Calculating total earned...")
    const totalEarnedResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_earned
      FROM game_rewards 
      WHERE wallet_address = ${wallet_address}
    `

    const totalEarned = Number(totalEarnedResult[0]?.total_earned || 0)
    console.log("Total earned:", totalEarned)

    // Get total claimed
    console.log("Calculating total claimed...")
    const totalClaimedResult = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_claimed
      FROM game_rewards 
      WHERE wallet_address = ${wallet_address} 
      AND claimed_at IS NOT NULL
    `

    const totalClaimed = Number(totalClaimedResult[0]?.total_claimed || 0)
    console.log("Total claimed:", totalClaimed)

    // Calculate unclaimed
    const unclaimedBalance = totalEarned - totalClaimed
    console.log("Unclaimed balance:", unclaimedBalance)

    // Get recent rewards
    console.log("Fetching recent rewards...")
    const recentRewards = await sql`
      SELECT 
        game_type,
        amount,
        earned_at,
        claimed_at,
        created_at
      FROM game_rewards 
      WHERE wallet_address = ${wallet_address}
      ORDER BY earned_at DESC 
      LIMIT 10
    `

    console.log("Recent rewards count:", recentRewards.length)
    console.log("Recent rewards sample:", JSON.stringify(recentRewards.slice(0, 3), null, 2))

    const response = {
      wallet_address,
      total_earned: totalEarned,
      total_claimed: totalClaimed,
      unclaimed_balance: unclaimedBalance,
      recent_rewards: recentRewards,
    }

    console.log("Final response:", JSON.stringify(response, null, 2))
    console.log("=== BALANCE ROUTE SUCCESS ===")

    return NextResponse.json(response)
  } catch (error) {
    console.error("=== BALANCE ROUTE ERROR ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error("=== BALANCE ROUTE ERROR END ===")

    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
  }
}
