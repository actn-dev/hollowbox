import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("=== ADMIN ROUTE GET START ===")

    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    console.log("Query params:", { wallet_address })

    let query
    let params = []

    if (wallet_address) {
      console.log("Querying for specific wallet:", wallet_address)
      query = `
        SELECT 
          wallet_address,
          game_type,
          amount,
          earned_at,
          claimed_at,
          created_at
        FROM game_rewards 
        WHERE wallet_address = $1
        ORDER BY earned_at DESC
      `
      params = [wallet_address]
    } else {
      console.log("Querying all rewards")
      query = `
        SELECT 
          wallet_address,
          game_type,
          amount,
          earned_at,
          claimed_at,
          created_at
        FROM game_rewards 
        ORDER BY earned_at DESC 
        LIMIT 100
      `
    }

    console.log("Executing query:", query)
    console.log("With params:", params)

    const result = await sql(query, ...params)

    console.log("Query result count:", result.length)
    console.log("Sample results:", JSON.stringify(result.slice(0, 3), null, 2))
    console.log("=== ADMIN ROUTE GET SUCCESS ===")

    return NextResponse.json({ rewards: result })
  } catch (error) {
    console.error("=== ADMIN ROUTE GET ERROR ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error("=== ADMIN ROUTE GET ERROR END ===")

    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("=== ADMIN ROUTE DELETE START ===")

    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    console.log("Delete request for wallet:", wallet_address)

    if (!wallet_address) {
      console.log("No wallet address provided for deletion")
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    console.log("Attempting to delete rewards for wallet:", wallet_address)

    const result = await sql`
      DELETE FROM game_rewards 
      WHERE wallet_address = ${wallet_address}
      RETURNING *
    `

    console.log("Delete result:", JSON.stringify(result, null, 2))
    console.log("Deleted count:", result.length)
    console.log("=== ADMIN ROUTE DELETE SUCCESS ===")

    return NextResponse.json({
      success: true,
      deleted_count: result.length,
    })
  } catch (error) {
    console.error("=== ADMIN ROUTE DELETE ERROR ===")
    console.error("Error type:", error?.constructor?.name)
    console.error("Error message:", error?.message)
    console.error("Error stack:", error?.stack)
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    console.error("=== ADMIN ROUTE DELETE ERROR END ===")

    return NextResponse.json({ error: "Failed to delete rewards" }, { status: 500 })
  }
}
