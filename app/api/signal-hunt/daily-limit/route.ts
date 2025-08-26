import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

function getCurrentTwoHourWindow() {
  const now = new Date();
  const hours = now.getUTCHours();
  const windowStart = Math.floor(hours / 2) * 2;

  const windowStartTime = new Date(now);
  windowStartTime.setUTCHours(windowStart, 0, 0, 0);

  const windowEndTime = new Date(windowStartTime);
  windowEndTime.setUTCHours(windowStartTime.getUTCHours() + 2);

  return { windowStartTime, windowEndTime };
}

function getNextResetTime() {
  const now = new Date();
  const hours = now.getUTCHours();
  const nextResetHour = Math.ceil((hours + 1) / 2) * 2;

  const resetTime = new Date(now);
  if (nextResetHour >= 24) {
    resetTime.setUTCDate(resetTime.getUTCDate() + 1);
    resetTime.setUTCHours(0, 0, 0, 0);
  } else {
    resetTime.setUTCHours(nextResetHour, 0, 0, 0);
  }

  return resetTime;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    console.log("Checking 2-hour limit for wallet:", walletAddress);

    const { windowStartTime, windowEndTime } = getCurrentTwoHourWindow();

    // First, let's check what columns exist in the table

    const tableInfo = await db.run(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'game_rewards'
    `);

    tableInfo.rows.forEach((row) => {
      console.log("Available columns in game_rewards:", row.column_name);
    });

    // Check tokens earned in current 2-hour window using the correct column name
    // Use game_type instead of activity_type since that's what exists in the table
    const result = await db.run(sql`
      SELECT COALESCE(SUM(tokens_earned), 0) as tokens_earned
      FROM game_rewards 
      WHERE wallet_address = ${walletAddress}
        AND game_type = 'global-signal-catcher'
        AND created_at >= ${windowStartTime.toISOString()}
        AND created_at < ${windowEndTime.toISOString()}
    `);

    const tokensEarned = Number.parseInt(
      (result.rows[0]?.tokens_earned as string) || "0"
    );
    const maxTokensPerWindow = 10;
    const canEarn = tokensEarned < maxTokensPerWindow;

    // Calculate next reset time
    const nextResetTime = getNextResetTime();

    console.log("Window calculation:", {
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
      tokensEarned,
      canEarn,
      nextReset: nextResetTime.toISOString(),
    });

    return NextResponse.json({
      tokensEarned,
      maxTokensPerWindow,
      remainingTokens: maxTokensPerWindow - tokensEarned,
      canEarn,
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
      nextResetTime: nextResetTime.toISOString(),
    });
  } catch (error) {
    console.error("Error checking 2-hour limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
