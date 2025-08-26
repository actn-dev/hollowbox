import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const itemsRes = await db.run(sql`
      SELECT 
        id,
        title,
        description,
        image_url as "imageUrl",
        tokens_required as "tokensRequired",
        category,
        is_active as "isActive",
        claims_remaining as "claimsRemaining",
        expiration_date as "expirationDate",
        winner_announced as "winnerAnnounced",
        winner_announced_at as "winnerAnnouncedAt",
        created_at as "createdAt"
      FROM claimable_items
      ORDER BY created_at DESC
  `);

    const items = itemsRes.rows || [];
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching claimable items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      description,
      imageUrl,
      tokensRequired,
      category,
      claimsRemaining,
      expirationDate,
    } = await request.json();

    if (!title || !description || !tokensRequired || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newItemRes = await db.run(sql`
      INSERT INTO claimable_items (
        title, 
        description, 
        image_url, 
        tokens_required, 
        category, 
        claims_remaining,
        expiration_date,
        is_active
      ) VALUES (
        ${title},
        ${description},
        ${imageUrl || null},
        ${Number(tokensRequired)},
        ${category},
        ${claimsRemaining ? Number(claimsRemaining) : null},
        ${expirationDate ? new Date(expirationDate) : null},
        true
      )
      RETURNING 
        id,
        title,
        description,
        image_url as "imageUrl",
        tokens_required as "tokensRequired",
        category,
        is_active as "isActive",
        claims_remaining as "claimsRemaining",
        expiration_date as "expirationDate",
        winner_announced as "winnerAnnounced",
        winner_announced_at as "winnerAnnouncedAt",
        created_at as "createdAt"
  `);

    const newItem = (newItemRes.rows || [])[0];
    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Error creating claimable item:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
