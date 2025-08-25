import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";
import { gameRewardsTable } from "@/server/db/schema/other";
import { eq, sum, not, and, isNotNull, desc } from "drizzle-orm";
// import { neon } from "@neondatabase/serverless"

// const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    console.log("=== BALANCE ROUTE START ===");

    const { searchParams } = new URL(request.url);
    const wallet_address = searchParams.get("wallet_address");

    console.log("Balance request for wallet:", wallet_address);

    if (!wallet_address) {
      console.log("No wallet address provided");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log("Fetching balance data...");

    // Get total earned
    console.log("Calculating total earned...");

    const totalEarnedResult = await db
      .select({
        total_earned: sum(gameRewardsTable.amount).as("total_earned"),
      })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.walletAddress, wallet_address));

    const totalEarned = Number(totalEarnedResult[0]?.total_earned ?? 0);
    console.log("Total earned:", totalEarned);

    // Get total claimed
    console.log("Calculating total claimed...");
    const totalClaimedResult = await db
      .select({
        total_claimed: sum(gameRewardsTable.amount).as("total_claimed"),
      })
      .from(gameRewardsTable)
      .where(
        and(
          eq(gameRewardsTable.walletAddress, wallet_address),
          // schema does not define `claimed_at` — use `processedAt` as the "claimed" timestamp
          isNotNull(gameRewardsTable.processedAt)
        )
      );

    const totalClaimed = Number(totalClaimedResult[0]?.total_claimed ?? 0);
    console.log("Total claimed:", totalClaimed);

    // Calculate unclaimed
    const unclaimedBalance = totalEarned - totalClaimed;
    console.log("Unclaimed balance:", unclaimedBalance);

    // Get recent rewards
    console.log("Fetching recent rewards...");
    const recentRewards = await db
      .select({
        game_type: gameRewardsTable.gameType,
        amount: gameRewardsTable.amount,
        earned_at: gameRewardsTable.createdAt, // schema has createdAt; use it for earned_at
        claimed_at: gameRewardsTable.processedAt,
        created_at: gameRewardsTable.createdAt,
      })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.walletAddress, wallet_address))
      .orderBy(desc(gameRewardsTable.createdAt))
      .limit(10);

    console.log("Recent rewards count:", recentRewards.length);
    console.log(
      "Recent rewards sample:",
      JSON.stringify(recentRewards.slice(0, 3), null, 2)
    );

    const response = {
      wallet_address,
      total_earned: totalEarned,
      total_claimed: totalClaimed,
      unclaimed_balance: unclaimedBalance,
      recent_rewards: recentRewards,
    };

    console.log("Final response:", JSON.stringify(response, null, 2));
    console.log("=== BALANCE ROUTE SUCCESS ===");

    return NextResponse.json(response);
  } catch (error) {
    console.error("=== BALANCE ROUTE ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    // @ts-ignore
    console.error("Error message:", error?.message);
    // @ts-ignore
    console.error("Error stack:", error?.stack);
    console.error(
      "Full error object:",
      JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    );
    console.error("=== BALANCE ROUTE ERROR END ===");

    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
