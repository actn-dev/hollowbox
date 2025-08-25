import { z } from "zod";
import { eq, desc, count, sum, gte, lt } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  gameRewardsTable,
  signalHuntPlayersTable,
  signalHuntCompletionsTable,
  userClaimsTable,
  bugReportsTable,
  suspiciousLogsTable,
} from "~/server/db/schema/other";

export const monitoringRouter = createTRPCRouter({
  // Get overall platform statistics
  getStats: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    // Total users (unique wallet addresses from various tables)
    const gameRewardUsers = await ctx.db
      .select({ walletAddress: gameRewardsTable.walletAddress })
      .from(gameRewardsTable)
      .groupBy(gameRewardsTable.walletAddress);

    const signalHuntUsers = await ctx.db
      .select({ count: count() })
      .from(signalHuntPlayersTable);

    const claimUsers = await ctx.db
      .select({ walletAddress: userClaimsTable.walletAddress })
      .from(userClaimsTable)
      .groupBy(userClaimsTable.walletAddress);

    // Activity today
    const todayRewards = await ctx.db
      .select({
        count: count(),
        total: sum(gameRewardsTable.amount),
      })
      .from(gameRewardsTable)
      .where(gte(gameRewardsTable.createdAt, today));

    const todayClaims = await ctx.db
      .select({ count: count() })
      .from(userClaimsTable)
      .where(gte(userClaimsTable.claimedAt, today));

    const todayCompletions = await ctx.db
      .select({ count: count() })
      .from(signalHuntCompletionsTable)
      .where(gte(signalHuntCompletionsTable.createdAt, today));

    // Total tokens distributed
    const totalTokensDistributed = await ctx.db
      .select({ total: sum(gameRewardsTable.amount) })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.processed, true));

    const pendingTokens = await ctx.db
      .select({ total: sum(gameRewardsTable.amount) })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.processed, false));

    return {
      users: {
        total: new Set([
          ...gameRewardUsers.map((u) => u.walletAddress),
          ...claimUsers.map((u) => u.walletAddress),
        ]).size,
        signalHuntPlayers: signalHuntUsers[0]?.count || 0,
      },
      activity: {
        today: {
          rewards: todayRewards[0]?.count || 0,
          tokensDistributed: Number(todayRewards[0]?.total) || 0,
          claims: todayClaims[0]?.count || 0,
          signalCompletions: todayCompletions[0]?.count || 0,
        },
      },
      tokens: {
        totalDistributed: Number(totalTokensDistributed[0]?.total) || 0,
        pendingDistribution: Number(pendingTokens[0]?.total) || 0,
      },
    };
  }),

  // Get time-series data for charts
  getTimeSeriesData: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        metric: z
          .enum(["rewards", "claims", "completions", "users"])
          .default("rewards"),
      })
    )
    .query(async ({ ctx, input }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      if (input.metric === "rewards") {
        const rewards = await ctx.db
          .select({
            date: gameRewardsTable.createdAt,
            count: count(),
            amount: sum(gameRewardsTable.amount),
          })
          .from(gameRewardsTable)
          .where(gte(gameRewardsTable.createdAt, startDate))
          .groupBy(gameRewardsTable.createdAt)
          .orderBy(gameRewardsTable.createdAt);

        return rewards.map((r) => ({
          date: r.date,
          value: r.count,
          amount: Number(r.amount) || 0,
        }));
      }

      if (input.metric === "claims") {
        const claims = await ctx.db
          .select({
            date: userClaimsTable.claimedAt,
            count: count(),
          })
          .from(userClaimsTable)
          .where(gte(userClaimsTable.claimedAt, startDate))
          .groupBy(userClaimsTable.claimedAt)
          .orderBy(userClaimsTable.claimedAt);

        return claims.map((c) => ({
          date: c.date,
          value: c.count,
        }));
      }

      if (input.metric === "completions") {
        const completions = await ctx.db
          .select({
            date: signalHuntCompletionsTable.createdAt,
            count: count(),
          })
          .from(signalHuntCompletionsTable)
          .where(gte(signalHuntCompletionsTable.createdAt, startDate))
          .groupBy(signalHuntCompletionsTable.createdAt)
          .orderBy(signalHuntCompletionsTable.createdAt);

        return completions.map((c) => ({
          date: c.date,
          value: c.count,
        }));
      }

      return [];
    }),

  // Get top performers
  getTopPerformers: protectedProcedure
    .input(
      z.object({
        category: z.enum(["rewards", "signals", "claims"]).default("rewards"),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.category === "rewards") {
        const topRewardUsers = await ctx.db
          .select({
            walletAddress: gameRewardsTable.walletAddress,
            totalRewards: sum(gameRewardsTable.amount),
            transactionCount: count(),
          })
          .from(gameRewardsTable)
          .groupBy(gameRewardsTable.walletAddress)
          .orderBy(desc(sum(gameRewardsTable.amount)))
          .limit(input.limit);

        return topRewardUsers.map((user) => ({
          walletAddress: user.walletAddress,
          value: Number(user.totalRewards) || 0,
          count: user.transactionCount,
        }));
      }

      if (input.category === "signals") {
        const topSignalUsers = await ctx.db
          .select()
          .from(signalHuntPlayersTable)
          .orderBy(desc(signalHuntPlayersTable.tokensEarned))
          .limit(input.limit);

        return topSignalUsers.map((user) => ({
          walletAddress: user.walletAddress,
          value: user.tokensEarned || 0,
          count: user.signalsFound || 0,
        }));
      }

      if (input.category === "claims") {
        const topClaimUsers = await ctx.db
          .select({
            walletAddress: userClaimsTable.walletAddress,
            claimCount: count(),
          })
          .from(userClaimsTable)
          .groupBy(userClaimsTable.walletAddress)
          .orderBy(desc(count()))
          .limit(input.limit);

        return topClaimUsers.map((user) => ({
          walletAddress: user.walletAddress,
          value: user.claimCount,
          count: user.claimCount,
        }));
      }

      return [];
    }),

  // Get system health metrics
  getHealthMetrics: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check recent activity
    const recentRewards = await ctx.db
      .select({ count: count() })
      .from(gameRewardsTable)
      .where(gte(gameRewardsTable.createdAt, oneHourAgo));

    const recentBugReports = await ctx.db
      .select({ count: count() })
      .from(bugReportsTable)
      .where(gte(bugReportsTable.createdAt, oneHourAgo));

    const unprocessedLogs = await ctx.db
      .select({ count: count() })
      .from(suspiciousLogsTable)
      .where(eq(suspiciousLogsTable.processed, false));

    // Calculate error rates (simplified)
    const totalBugReports = await ctx.db
      .select({ count: count() })
      .from(bugReportsTable);

    return {
      activity: {
        recentRewards: recentRewards[0]?.count || 0,
        recentBugReports: recentBugReports[0]?.count || 0,
      },
      pending: {
        unprocessedLogs: unprocessedLogs[0]?.count || 0,
      },
      errors: {
        totalBugReports: totalBugReports[0]?.count || 0,
      },
      status: "healthy", // This would be calculated based on thresholds
      lastUpdated: now,
    };
  }),

  // Log activity (for tracking user actions)
  logActivity: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56).optional(),
        action: z.string().max(100),
        details: z.record(z.any()).optional(),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically log to a dedicated activity table
      // For now, we'll just return success
      console.log("Activity logged:", input);

      return {
        success: true,
        timestamp: new Date(),
      };
    }),
});
