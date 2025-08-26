import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all claims with item details
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
        ci.title as "itemTitle",
        ci.category as "itemCategory",
        ci.tokens_required as "tokensRequired",
        ci.expiration_date as "expirationDate",
        ci.winner_announced as "winnerAnnounced"
      FROM user_claims uc
      JOIN claimable_items ci ON uc.item_id = ci.id
      ORDER BY uc.claimed_at DESC
  `);
    const claims = claimsRes.rows || [];

    // Get statistics
    const statsRes = await db.run(sql`
      SELECT 
        COUNT(*) as "totalClaims",
        COUNT(CASE WHEN uc.status = 'pending' THEN 1 END) as "pendingClaims",
        COUNT(CASE WHEN uc.status = 'approved' THEN 1 END) as "approvedClaims",
        COUNT(CASE WHEN uc.status = 'shipped' THEN 1 END) as "shippedClaims",
        COUNT(CASE WHEN uc.status = 'completed' THEN 1 END) as "completedClaims",
        COUNT(CASE WHEN uc.status = 'cancelled' THEN 1 END) as "cancelledClaims",
        COUNT(DISTINCT uc.wallet_address) as "uniqueUsers",
        COUNT(DISTINCT ci.id) as "totalItems",
        COUNT(CASE WHEN ci.is_active = true THEN 1 END) as "activeItems",
        COUNT(CASE WHEN ci.expiration_date < NOW() THEN 1 END) as "expiredItems",
        COUNT(CASE WHEN ci.winner_announced = true THEN 1 END) as "itemsWithWinners"
      FROM user_claims uc
      JOIN claimable_items ci ON uc.item_id = ci.id
  `);
    const stats = (statsRes.rows || [])[0] || {};

    return NextResponse.json({
      claims,
      stats: {
        totalClaims: Number(stats.totalClaims),
        pendingClaims: Number(stats.pendingClaims),
        approvedClaims: Number(stats.approvedClaims),
        shippedClaims: Number(stats.shippedClaims),
        completedClaims: Number(stats.completedClaims),
        cancelledClaims: Number(stats.cancelledClaims),
        uniqueUsers: Number(stats.uniqueUsers),
        totalItems: Number(stats.totalItems),
        activeItems: Number(stats.activeItems),
        expiredItems: Number(stats.expiredItems),
        itemsWithWinners: Number(stats.itemsWithWinners),
      },
    });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
