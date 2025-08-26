import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();

    if (
      !status ||
      !["pending", "approved", "shipped", "completed", "cancelled"].includes(
        status
      )
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedRes = await db.run(sql`
      UPDATE user_claims
      SET status = ${status}
      WHERE id = ${Number(params.id)}
      RETURNING 
        id,
        item_id as "itemId",
        wallet_address as "walletAddress",
        user_name as "userName",
        user_email as "userEmail",
        user_address as "userAddress",
        user_phone as "userPhone",
        user_notes as "userNotes",
        entries,
        status,
        claimed_at as "claimedAt"
    `);

    const updatedClaim = (updatedRes.rows || [])[0];

    if (!updatedClaim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Format the response
    const result = {
      ...updatedClaim,
      userInfo: {
        name: updatedClaim.userName,
        email: updatedClaim.userEmail,
        address: updatedClaim.userAddress,
        phone: updatedClaim.userPhone,
        notes: updatedClaim.userNotes,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating claim status:", error);
    return NextResponse.json(
      { error: "Failed to update claim status" },
      { status: 500 }
    );
  }
}
