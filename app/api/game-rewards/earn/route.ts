import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("=== EARN ROUTE START ===")
    const body = await request.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    const { wallet_address, game_type, amount } = body

    if (!wallet_address || !game_type || !amount) {
      console.log("Missing required fields:", { wallet_address, game_type, amount })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Attempting to insert game reward:", {
      wallet_address,
      game_type,
      amount,
      timestamp: new Date().toISOString(),
    })

    // Insert the reward
    const result = await sql`
      INSERT INTO game_rewards (wallet_address, game_type, amount, earned_at)
      VALUES (${wallet_address}, ${game_type}, ${amount}, NOW())
      RETURNING *
    `

    console.log("Insert result:", JSON.stringify(result, null, 2))
    console.log("=== EARN ROUTE SUCCESS ===")

    return NextResponse.json({
      success: true,
      reward: result[0],
    })
  } catch (error) {
    console.error("=== EARN ROUTE ERROR ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error("=== EARN ROUTE ERROR END ===")

    return NextResponse.json({ error: "Failed to record reward" }, { status: 500 })
  }
}
