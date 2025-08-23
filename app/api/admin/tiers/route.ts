import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const tiers = await sql`
      SELECT 
        id,
        tier_level as "tierLevel",
        tier_name as "tierName",
        token_requirement as "tokenRequirement",
        tier_color as "tierColor",
        tier_bg_color as "tierBgColor",
        tier_border_color as "tierBorderColor",
        tier_icon as "tierIcon",
        benefits,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tier_config
      ORDER BY tier_level ASC
    `

    return NextResponse.json(tiers)
  } catch (error) {
    console.error("Error fetching tier config:", error)
    return NextResponse.json({ error: "Failed to fetch tier configuration" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tierLevel, tierName, tokenRequirement, tierColor, tierBgColor, tierBorderColor, tierIcon, benefits } = body

    // Validate required fields
    if (!tierLevel || !tierName || !tokenRequirement) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate token requirement is positive
    if (tokenRequirement <= 0) {
      return NextResponse.json({ error: "Token requirement must be positive" }, { status: 400 })
    }

    const [newTier] = await sql`
      INSERT INTO tier_config (
        tier_level, tier_name, token_requirement, tier_color, 
        tier_bg_color, tier_border_color, tier_icon, benefits
      ) VALUES (
        ${tierLevel}, ${tierName}, ${tokenRequirement}, ${tierColor || "text-gray-400"},
        ${tierBgColor || "bg-gray-400/10"}, ${tierBorderColor || "border-gray-400/20"}, 
        ${tierIcon || "Circle"}, ${benefits || []}
      )
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

    return NextResponse.json(newTier)
  } catch (error) {
    console.error("Error creating tier:", error)
    if (error.code === "23505") {
      // Unique constraint violation
      return NextResponse.json({ error: "Tier level already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create tier" }, { status: 500 })
  }
}
