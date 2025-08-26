import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Get daily leaderboard (today's completions)
    const dailyRes = await db.run(sql`
      SELECT 
        p.wallet_address,
        p.tokens_earned,
        p.signals_found,
        p.perfect_rhythms,
        p.lore_unlocked,
        p.last_scan_time,
        COALESCE(daily_stats.daily_score, 0) as daily_score,
        COALESCE(daily_stats.daily_signals, 0) as daily_signals,
        COALESCE(daily_stats.daily_perfect, 0) as daily_perfect,
        COALESCE(daily_stats.daily_tokens, 0) as daily_tokens
      FROM signal_hunt_players p
      LEFT JOIN (
        SELECT 
          wallet_address,
          SUM(score) as daily_score,
          COUNT(*) as daily_signals,
          SUM(CASE WHEN perfect THEN 1 ELSE 0 END) as daily_perfect,
          SUM(tokens_earned) as daily_tokens
        FROM signal_hunt_completions 
        WHERE DATE(created_at) = CURRENT_DATE
        GROUP BY wallet_address
      ) daily_stats ON p.wallet_address = daily_stats.wallet_address
      WHERE p.signals_found > 0
      ORDER BY daily_stats.daily_score DESC NULLS LAST, p.tokens_earned DESC
      LIMIT 10
    `);
    const dailyLeaders = (dailyRes.rows || []) as any[];

    // Get weekly leaderboard (this week's completions)
    const weeklyRes = await db.run(sql`
      SELECT 
        p.wallet_address,
        p.tokens_earned,
        p.signals_found,
        p.perfect_rhythms,
        p.lore_unlocked,
        p.last_scan_time,
        COALESCE(weekly_stats.weekly_score, 0) as weekly_score,
        COALESCE(weekly_stats.weekly_signals, 0) as weekly_signals,
        COALESCE(weekly_stats.weekly_perfect, 0) as weekly_perfect,
        COALESCE(weekly_stats.weekly_tokens, 0) as weekly_tokens
      FROM signal_hunt_players p
      LEFT JOIN (
        SELECT 
          wallet_address,
          SUM(score) as weekly_score,
          COUNT(*) as weekly_signals,
          SUM(CASE WHEN perfect THEN 1 ELSE 0 END) as weekly_perfect,
          SUM(tokens_earned) as weekly_tokens
        FROM signal_hunt_completions 
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
        GROUP BY wallet_address
      ) weekly_stats ON p.wallet_address = weekly_stats.wallet_address
      WHERE p.signals_found > 0
      ORDER BY weekly_stats.weekly_score DESC NULLS LAST, p.tokens_earned DESC
      LIMIT 10
    `);
    const weeklyLeaders = (weeklyRes.rows || []) as any[];

    // Get all-time leaderboard
    const allTimeRes = await db.run(sql`
      SELECT 
        wallet_address,
        tokens_earned,
        signals_found,
        perfect_rhythms,
        lore_unlocked,
        last_scan_time,
        (tokens_earned + (perfect_rhythms * 100) + (signals_found * 50)) as total_score
      FROM signal_hunt_players
      WHERE signals_found > 0
      ORDER BY total_score DESC, tokens_earned DESC
      LIMIT 10
    `);
    const allTimeLeaders = (allTimeRes.rows || []) as any[];

    const formatLeaderboard = (leaders: any[], scoreField = "total_score") => {
      return leaders.map((leader, index) => ({
        rank: index + 1,
        wallet: leader.wallet_address,
        score: leader[scoreField] || leader.total_score || 0,
        signalsFound:
          leader.signals_found ||
          leader.daily_signals ||
          leader.weekly_signals ||
          0,
        perfectRhythms:
          leader.perfect_rhythms ||
          leader.daily_perfect ||
          leader.weekly_perfect ||
          0,
        loreUnlocked: leader.lore_unlocked || 0,
        tokensEarned:
          leader.tokens_earned ||
          leader.daily_tokens ||
          leader.weekly_tokens ||
          0,
        lastActive: leader.last_scan_time,
      }));
    };

    return NextResponse.json({
      daily: formatLeaderboard(dailyLeaders, "daily_score"),
      weekly: formatLeaderboard(weeklyLeaders, "weekly_score"),
      allTime: formatLeaderboard(allTimeLeaders, "total_score"),
    });
  } catch (error) {
    console.error("Error fetching leaderboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboards" },
      { status: 500 }
    );
  }
}
