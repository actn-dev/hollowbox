import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    console.log("=== CLAIM ROUTE START ===");
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { wallet_address } = body;

    if (!wallet_address) {
      console.log("Missing wallet_address");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log("Processing claim for wallet:", wallet_address);

    // Get unclaimed rewards
    console.log("Fetching unclaimed rewards...");
    const unclaimedRes = await db.run(sql`
      SELECT * FROM game_rewards 
      WHERE wallet_address = ${wallet_address} 
      AND claimed_at IS NULL
    `);
    const unclaimedRewards = (unclaimedRes.rows || []) as any[];

    console.log("Unclaimed rewards found:", unclaimedRewards.length);
    console.log(
      "Unclaimed rewards:",
      JSON.stringify(unclaimedRewards, null, 2)
    );

    if (unclaimedRewards.length === 0) {
      console.log("No unclaimed rewards found");
      return NextResponse.json(
        { error: "No unclaimed rewards found" },
        { status: 404 }
      );
    }

    // Calculate total
    const totalAmount = unclaimedRewards.reduce(
      (sum, reward) => sum + Number(reward.amount || 0),
      0
    );
    console.log("Total amount to claim:", totalAmount);

    // Mark as claimed
    console.log("Marking rewards as claimed...");
    const claimedRes = await db.run(sql`
      UPDATE game_rewards 
      SET claimed_at = NOW() 
      WHERE wallet_address = ${wallet_address} 
      AND claimed_at IS NULL
      RETURNING *
    `);
    const claimedRewards = (claimedRes.rows || []) as any[];

    console.log(
      "Claimed rewards result:",
      JSON.stringify(claimedRewards, null, 2)
    );
    console.log("=== CLAIM ROUTE SUCCESS ===");

    return NextResponse.json({
      success: true,
      total_claimed: totalAmount,
      rewards_count: claimedRewards.length,
      rewards: claimedRewards,
    });
  } catch (error) {
    console.error("=== CLAIM ROUTE ERROR ===");
    console.error("Error type:", (error as any)?.constructor?.name);
    console.error("Error message:", (error as any)?.message);
    console.error("Error stack:", (error as any)?.stack);
    console.error(
      "Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("=== CLAIM ROUTE ERROR END ===");

    return NextResponse.json(
      { error: "Failed to claim rewards" },
      { status: 500 }
    );
  }
}
