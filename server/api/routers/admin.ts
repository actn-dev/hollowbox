import { z } from "zod";
import { eq, desc, count, sum } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  bugReportsTable,
  claimableItemsTable,
  userClaimsTable,
  gameRewardsTable,
  signalHuntPlayersTable,
  profitTrackerWalletsTable,
  watchlistTable,
  suspiciousLogsTable,
  tierConfigTable,
} from "~/server/db/schema/other";

export const adminRouter = createTRPCRouter({
  // Get admin dashboard statistics
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    // Bug reports stats
    const totalBugReports = await ctx.db
      .select({ count: count() })
      .from(bugReportsTable);

    const openBugReports = await ctx.db
      .select({ count: count() })
      .from(bugReportsTable)
      .where(eq(bugReportsTable.status, "open"));

    // Claims stats
    const totalClaims = await ctx.db
      .select({ count: count() })
      .from(userClaimsTable);

    const pendingClaims = await ctx.db
      .select({ count: count() })
      .from(userClaimsTable)
      .where(eq(userClaimsTable.status, "pending"));

    // Game rewards stats
    const totalRewards = await ctx.db
      .select({
        count: count(),
        total: sum(gameRewardsTable.amount),
      })
      .from(gameRewardsTable);

    const pendingRewards = await ctx.db
      .select({
        count: count(),
        total: sum(gameRewardsTable.amount),
      })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.processed, false));

    // Signal Hunt stats
    const totalPlayers = await ctx.db
      .select({ count: count() })
      .from(signalHuntPlayersTable);

    // Watchlist stats
    const totalWatched = await ctx.db
      .select({ count: count() })
      .from(watchlistTable);

    const unprocessedLogs = await ctx.db
      .select({ count: count() })
      .from(suspiciousLogsTable)
      .where(eq(suspiciousLogsTable.processed, false));

    return {
      bugReports: {
        total: totalBugReports[0]?.count || 0,
        open: openBugReports[0]?.count || 0,
      },
      claims: {
        total: totalClaims[0]?.count || 0,
        pending: pendingClaims[0]?.count || 0,
      },
      gameRewards: {
        totalTransactions: totalRewards[0]?.count || 0,
        totalAmount: Number(totalRewards[0]?.total) || 0,
        pendingTransactions: pendingRewards[0]?.count || 0,
        pendingAmount: Number(pendingRewards[0]?.total) || 0,
      },
      signalHunt: {
        totalPlayers: totalPlayers[0]?.count || 0,
      },
      watchlist: {
        totalWatched: totalWatched[0]?.count || 0,
        unprocessedLogs: unprocessedLogs[0]?.count || 0,
      },
    };
  }),

  // Get recent activity
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // Recent bug reports
      const recentBugReports = await ctx.db
        .select({
          id: bugReportsTable.id,
          type: "bug_report" as const,
          title: bugReportsTable.title,
          userWallet: bugReportsTable.userWallet,
          createdAt: bugReportsTable.createdAt,
        })
        .from(bugReportsTable)
        .orderBy(desc(bugReportsTable.createdAt))
        .limit(5);

      // Recent claims
      const recentClaims = await ctx.db
        .select({
          id: userClaimsTable.id,
          type: "claim" as const,
          walletAddress: userClaimsTable.walletAddress,
          userName: userClaimsTable.userName,
          createdAt: userClaimsTable.claimedAt,
        })
        .from(userClaimsTable)
        .orderBy(desc(userClaimsTable.claimedAt))
        .limit(5);

      // Recent game rewards
      const recentRewards = await ctx.db
        .select({
          id: gameRewardsTable.id,
          type: "game_reward" as const,
          walletAddress: gameRewardsTable.walletAddress,
          game: gameRewardsTable.game,
          amount: gameRewardsTable.amount,
          createdAt: gameRewardsTable.createdAt,
        })
        .from(gameRewardsTable)
        .orderBy(desc(gameRewardsTable.createdAt))
        .limit(5);

      // Combine and sort all activities
      const allActivities = [
        ...recentBugReports.map((item) => ({
          ...item,
          description: `Bug report: ${item.title}`,
        })),
        ...recentClaims.map((item) => ({
          ...item,
          description: `Claim by ${item.userName}`,
        })),
        ...recentRewards.map((item) => ({
          ...item,
          description: `${item.game} reward: ${item.amount} tokens`,
        })),
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, input.limit);

      return allActivities;
    }),

  // System health check
  getSystemHealth: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Test database connection
      const dbTest = await ctx.db
        .select({ count: count() })
        .from(tierConfigTable);

      return {
        status: "healthy",
        database: "connected",
        timestamp: new Date(),
        checks: {
          database: dbTest[0]?.count !== undefined ? "pass" : "fail",
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        database: "error",
        timestamp: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
        checks: {
          database: "fail",
        },
      };
    }
  }),

  // Get user details (for admin user management)
  getUserDetails: protectedProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      // Get user's claims
      const userClaims = await ctx.db
        .select()
        .from(userClaimsTable)
        .where(eq(userClaimsTable.walletAddress, input.walletAddress))
        .orderBy(desc(userClaimsTable.claimedAt));

      // Get user's game rewards
      const gameRewards = await ctx.db
        .select()
        .from(gameRewardsTable)
        .where(eq(gameRewardsTable.walletAddress, input.walletAddress))
        .orderBy(desc(gameRewardsTable.createdAt));

      // Get signal hunt stats
      const signalHuntStats = await ctx.db
        .select()
        .from(signalHuntPlayersTable)
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      // Check if user is on watchlist
      const watchlistEntry = await ctx.db
        .select()
        .from(watchlistTable)
        .where(eq(watchlistTable.wallet, input.walletAddress));

      return {
        walletAddress: input.walletAddress,
        claims: userClaims,
        gameRewards: gameRewards,
        signalHuntStats: signalHuntStats[0] || null,
        isWatched: watchlistEntry.length > 0,
        watchlistStatus: watchlistEntry[0]?.status || null,
      };
    }),

  // Emergency functions
  emergencyBroadcast: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
        type: z.enum(["info", "warning", "error"]).default("info"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically send notifications to all users
      // For now, we'll just log it
      console.log(`Emergency broadcast [${input.type}]: ${input.message}`);

      return {
        success: true,
        message: "Broadcast sent",
        timestamp: new Date(),
      };
    }),
});
