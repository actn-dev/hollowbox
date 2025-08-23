import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { tierName, tokenRequirement, tierColor, tierBgColor, tierBorderColor, tierIcon, benefits, isActive } = body
    const tierId = params.id

    // Validate required fields
    if (!tierName || !tokenRequirement) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate token requirement is positive
    if (tokenRequirement <= 0) {
      return NextResponse.json({ error: "Token requirement must be positive" }, { status: 400 })
    }

    const [updatedTier] = await sql`
      UPDATE tier_config 
      SET 
        tier_name = ${tierName},
        token_requirement = ${tokenRequirement},
        tier_color = ${tierColor || "text-gray-400"},
        tier_bg_color = ${tierBgColor || "bg-gray-400/10"},
        tier_border_color = ${tierBorderColor || "border-gray-400/20"},
        tier_icon = ${tierIcon || "Circle"},
        benefits = ${benefits || []},
        is_active = ${isActive !== undefined ? isActive : true},
        updated_at = NOW()
      WHERE id = ${tierId}
      RETURNING 
        id,
        tier_level as "tierLevel",
        tier_name as "tierName",
        token_requirement as "tokenRequirement",
        tier_color as "tierColor",
        tier_bg_color as "tierBgColor",
        tier_border_color as "tierBorderColor",
        tier_icon as "tierIcon",
        benefits,
        is_active as "isActive"
    `

    if (!updatedTier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 })
    }

    return NextResponse.json(updatedTier)
  } catch (error) {
    console.error("Error updating tier:", error)
    return NextResponse.json({ error: "Failed to update tier" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const tierId = params.id

    const [deletedTier] = await sql`
      DELETE FROM tier_config 
      WHERE id = ${tierId}
      RETURNING id, tier_level as "tierLevel", tier_name as "tierName"
    `

    if (!deletedTier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Tier deleted successfully", tier: deletedTier })
  } catch (error) {
    console.error("Error deleting tier:", error)
    return NextResponse.json({ error: "Failed to delete tier" }, { status: 500 })
  }
}
