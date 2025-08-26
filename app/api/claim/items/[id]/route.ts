import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemRes = await db.run(sql`
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
      WHERE id = ${Number(params.id)}
  `);

    const item = (itemRes.rows || [])[0];

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching claimable item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      title,
      description,
      imageUrl,
      tokensRequired,
      category,
      isActive,
      claimsRemaining,
      expirationDate,
    } = await request.json();

    const updatedRes = await db.run(sql`
      UPDATE claimable_items
      SET 
        title = ${title},
        description = ${description},
        image_url = ${imageUrl || null},
        tokens_required = ${Number(tokensRequired)},
        category = ${category},
        is_active = ${Boolean(isActive)},
        claims_remaining = ${claimsRemaining ? Number(claimsRemaining) : null},
        expiration_date = ${expirationDate ? new Date(expirationDate) : null}
      WHERE id = ${Number(params.id)}
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

    const updatedItem = (updatedRes.rows || [])[0];

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Error updating claimable item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deletedRes = await db.run(sql`
      DELETE FROM claimable_items
      WHERE id = ${Number(params.id)}
      RETURNING id
    `);

    const deletedItem = (deletedRes.rows || [])[0];

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting claimable item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
