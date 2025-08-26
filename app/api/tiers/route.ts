import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const tiers = await db.run(sql`
      SELECT 
        id,
        tier_level as "tierLevel",
        tier_name as "tierName",
        token_requirement as "tokenRequirement",
        tier_color as "tierColor",
        tier_bg_color as "tierBgColor",
        tier_border_color as "tierBorderColor",
        tier_icon as "tierIcon",
        benefits
      FROM tier_config
      WHERE is_active = true
      ORDER BY tier_level ASC
    `);

    return NextResponse.json(tiers.rows);
  } catch (error) {
    console.error("Error fetching tiers:", error);
    return NextResponse.json(
      { error: "Failed to fetch tiers" },
      { status: 500 }
    );
  }
}
