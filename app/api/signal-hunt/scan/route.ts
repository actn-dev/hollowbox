import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { gameRewardsTable } from "@/server/db/schema/other";
import { eq, and, gte, lt, count, desc } from "drizzle-orm";
// import { neon } from "@neondatabase/serverless"

// const sql = neon(process.env.DATABASE_URL!)

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

    console.log("Checking scan limit for wallet:", walletAddress);

    const { windowStartTime, windowEndTime } = getCurrentTwoHourWindow();

    // Use numeric timestamps to match schema integer("created_at", { mode: "timestamp" })
    const windowStartDate = windowStartTime;
    const windowEndDate = windowEndTime;

    // Check scans used in current 2-hour window via Drizzle
    const result = await db
      .select({
        scan_count: count(gameRewardsTable.id).as("scan_count"),
      })
      .from(gameRewardsTable)
      .where(
        and(
          eq(gameRewardsTable.walletAddress, walletAddress),
          eq(gameRewardsTable.gameType, "signal-scan"),
          gte(gameRewardsTable.createdAt, windowStartDate),
          lt(gameRewardsTable.createdAt, windowEndDate)
        )
      );

    const scansUsed = Number(result[0]?.scan_count ?? 0);
    const maxScansPerWindow = 5;
    const canScan = scansUsed < maxScansPerWindow;

    const nextResetTime = getNextResetTime();

    console.log("Scan window calculation:", {
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
      scansUsed,
      canScan,
      nextReset: nextResetTime.toISOString(),
    });

    return NextResponse.json({
      scansUsed,
      maxScansPerWindow,
      remainingScans: Math.max(0, maxScansPerWindow - scansUsed),
      canScan,
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
      nextResetTime: nextResetTime.toISOString(),
    });
  } catch (error) {
    console.error("Error checking scan limit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, scanType = "manual" } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const { windowStartTime, windowEndTime } = getCurrentTwoHourWindow();
    // Use Date objects to match the column type (timestamp/date)
    const windowStartDate = windowStartTime;
    const windowEndDate = windowEndTime;

    // Check current scans in this window
    const checkResult = await db
      .select({
        scan_count: count(gameRewardsTable.id).as("scan_count"),
      })
      .from(gameRewardsTable)
      .where(
        and(
          eq(gameRewardsTable.walletAddress, walletAddress),
          eq(gameRewardsTable.gameType, "signal-scan"),
          gte(gameRewardsTable.createdAt, windowStartDate),
          lt(gameRewardsTable.createdAt, windowEndDate)
        )
      );

    const currentScans = Number(checkResult[0]?.scan_count ?? 0);
    const maxScans = 5;

    if (currentScans >= maxScans) {
      return NextResponse.json(
        {
          error: "Scan limit reached for this 2-hour window",
          scansUsed: currentScans,
          maxScansPerWindow: maxScans,
          nextResetTime: getNextResetTime().toISOString(),
        },
        { status: 429 }
      );
    }

    await db
      .insert(gameRewardsTable)
      .values({
        walletAddress,
        gameType: "signal-scan",
        amount: 0,
        metadata: JSON.stringify({
          scanType,
          window: windowStartTime.toISOString(),
        }),
        createdAt: new Date(),
        game: "signal-scan",
      })
      .run();

    // Simulate scan results (random chance of finding signals)
    const foundSignals: Array<Record<string, any>> = [];
    const signalChance = 0.3; // 30% chance per scan

    if (Math.random() < signalChance) {
      const signalStrength = Math.random();
      const tokensFound =
        signalStrength > 0.8 ? 3 : signalStrength > 0.5 ? 2 : 1;

      await db
        .insert(gameRewardsTable)
        .values({
          walletAddress,
          gameType: "signal-found",
          amount: tokensFound,
          metadata: JSON.stringify({
            signalStrength: Math.round(signalStrength * 100),
            scanType,
            window: windowStartTime.toISOString(),
          }),
          createdAt: new Date(),
          game: "signal-found",
        })
        .run();

      foundSignals.push({
        strength: Math.round(signalStrength * 100),
        tokens: tokensFound,
        type:
          signalStrength > 0.8
            ? "rare"
            : signalStrength > 0.5
            ? "strong"
            : "weak",
      });
    }

    const newScanCount = currentScans + 1;
    const nextResetTime = getNextResetTime();

    return NextResponse.json({
      success: true,
      scansUsed: newScanCount,
      maxScansPerWindow: maxScans,
      remainingScans: Math.max(0, maxScans - newScanCount),
      canScan: newScanCount < maxScans,
      foundSignals,
      nextResetTime: nextResetTime.toISOString(),
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
    });
  } catch (error) {
    console.error("Error performing scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
