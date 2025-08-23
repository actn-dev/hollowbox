import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { itemId } = await request.json()

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 })
    }

    // Get the item and check if winner can be announced
    const [item] = await sql`
      SELECT 
        id,
        title,
        winner_announced as "winnerAnnounced",
        expiration_date as "expirationDate",
        claims_remaining as "claimsRemaining"
      FROM claimable_items
      WHERE id = ${Number(itemId)}
    `

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.winnerAnnounced) {
      return NextResponse.json({ error: "Winner has already been announced for this item" }, { status: 400 })
    }

    // Get all entries for this item
    const entries = await sql`
      SELECT 
        id,
        wallet_address as "walletAddress",
        entries,
        user_name as "userName",
        user_email as "userEmail"
      FROM user_claims
      WHERE item_id = ${Number(itemId)} AND status = 'pending'
      ORDER BY claimed_at ASC
    `

    if (entries.length === 0) {
      return NextResponse.json({ error: "No entries found for this drawing" }, { status: 400 })
    }

    // Create weighted array based on entries
    const weightedEntries: number[] = []
    entries.forEach((entry, index) => {
      for (let i = 0; i < entry.entries; i++) {
        weightedEntries.push(index)
      }
    })

    // Select random winner
    const randomIndex = Math.floor(Math.random() * weightedEntries.length)
    const winnerIndex = weightedEntries[randomIndex]
    const winner = entries[winnerIndex]

    // Update the winner's status to approved
    await sql`
      UPDATE user_claims
      SET status = 'approved'
      WHERE id = ${winner.id}
    `

    // Update all other entries to cancelled
    await sql`
      UPDATE user_claims
      SET status = 'cancelled'
      WHERE item_id = ${Number(itemId)} AND id != ${winner.id}
    `

    // Mark winner as announced for the item
    await sql`
      UPDATE claimable_items
      SET 
        winner_announced = true,
        winner_announced_at = NOW()
      WHERE id = ${Number(itemId)}
    `

    return NextResponse.json({
      message: "Winner announced successfully",
      winner: {
        id: winner.id,
        walletAddress: winner.walletAddress,
        userName: winner.userName,
        userEmail: winner.userEmail,
        entries: winner.entries,
      },
      totalEntries: weightedEntries.length,
      totalParticipants: entries.length,
    })
  } catch (error) {
    console.error("Error announcing winner:", error)
    return NextResponse.json({ error: "Failed to announce winner" }, { status: 500 })
  }
}
