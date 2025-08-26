import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { signalId, score, perfect, wallet } = await request.json();

    if (!signalId || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet required for rhythm completion" },
        { status: 400 }
      );
    }

    // Get the signal
    const signalResult = await db.run(sql`
      SELECT * FROM signal_hunt_found_signals 
      WHERE signal_id = ${signalId} AND wallet_address = ${wallet}
      LIMIT 1
    `);

    if (((signalResult.rows || []) as any[]).length === 0) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    const signal = (signalResult.rows as any[])[0];

    if (signal.completed) {
      return NextResponse.json(
        { error: "Signal already completed" },
        { status: 400 }
      );
    }

    // Calculate final reward based on score and perfect performance
    let finalReward = signal.reward;
    if (perfect) {
      finalReward = Math.floor(finalReward * 1.5); // 50% bonus for perfect
    } else if (score > 80) {
      finalReward = Math.floor(finalReward * 1.2); // 20% bonus for high score
    }

    // Mark signal as completed
    await db.run(sql`
      UPDATE signal_hunt_found_signals 
      SET completed = true, completion_score = ${score}, reward = ${finalReward}
      WHERE signal_id = ${signalId} AND wallet_address = ${wallet}
    `);

    // Update player stats
    const updatedStats = await db.run(sql`
      UPDATE signal_hunt_players 
      SET tokens_earned = tokens_earned + ${finalReward},
          perfect_rhythms = perfect_rhythms + ${perfect ? 1 : 0}
      WHERE wallet_address = ${wallet}
      RETURNING *
    `);

    const playerStats = ((updatedStats.rows || []) as any[])[0];

    // Record the completion in leaderboard
    await db.run(sql`
      INSERT INTO signal_hunt_completions (
        wallet_address, signal_id, signal_type, score, perfect, tokens_earned
      ) VALUES (
        ${wallet}, ${signalId}, ${signal.signal_type}, ${score}, ${perfect}, ${finalReward}
      )
    `);

    return NextResponse.json({
      success: true,
      reward: finalReward,
      stats: {
        scansUsed: playerStats?.scans_used ?? 0,
        maxScans: playerStats?.max_scans ?? 0,
        tokensEarned: playerStats?.tokens_earned ?? 0,
        signalsFound: playerStats?.signals_found ?? 0,
        perfectRhythms: playerStats?.perfect_rhythms ?? 0,
        loreUnlocked: playerStats?.lore_unlocked ?? 0,
        lastScanTime: playerStats?.last_scan_time,
        nextResetTime: getNextResetTime(),
      },
    });
  } catch (error) {
    console.error("Error completing rhythm game:", error);
    return NextResponse.json(
      { error: "Failed to complete rhythm game" },
      { status: 500 }
    );
  }
}

function getNextResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
