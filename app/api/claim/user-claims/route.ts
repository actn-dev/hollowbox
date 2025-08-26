import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate Stellar address format
    if (!/^G[A-Z2-7]{55}$/.test(address)) {
      return NextResponse.json(
        { error: "Invalid Stellar wallet address format" },
        { status: 400 }
      );
    }

    const claimsRes = await db.run(sql`
      SELECT 
        uc.id,
        uc.item_id as "itemId",
        uc.wallet_address as "walletAddress",
        json_build_object(
          'name', uc.user_name,
          'email', uc.user_email,
          'address', uc.user_address,
          'phone', uc.user_phone,
          'notes', uc.user_notes
        ) as "userInfo",
        uc.entries,
        uc.status,
        uc.claimed_at as "claimedAt",
        ci.expiration_date as "expirationDate",
        ci.winner_announced as "winnerAnnounced",
        ci.winner_announced_at as "winnerAnnouncedAt"
      FROM user_claims uc
      JOIN claimable_items ci ON uc.item_id = ci.id
      WHERE uc.wallet_address = ${address}
      ORDER BY uc.claimed_at DESC
    `);
    const claims = claimsRes.rows || [];
    return NextResponse.json(claims);
  } catch (error) {
    console.error("Error fetching user claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch user claims" },
      { status: 500 }
    );
  }
}
