import { z } from "zod";
import { sum, count, desc, gte, eq, and } from "drizzle-orm";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  gameRewardsTable,
  signalHuntPlayersTable,
  signalHuntCompletionsTable,
  userClaimsTable,
  claimableItemsTable,
} from "~/server/db/schema/other";

export const tokenStatsRouter = createTRPCRouter({
  // Get overall token statistics
  getOverallStats: publicProcedure.query(async ({ ctx }) => {
    // Total tokens distributed through game rewards
    const gameRewardsStats = await ctx.db
      .select({
        totalDistributed: sum(gameRewardsTable.amount),
        totalTransactions: count(),
      })
      .from(gameRewardsTable);

    const processedRewards = await ctx.db
      .select({
        processedAmount: sum(gameRewardsTable.amount),
      })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.processed, true));

    const pendingRewards = await ctx.db
      .select({
        pendingAmount: sum(gameRewardsTable.amount),
      })
      .from(gameRewardsTable)
      .where(eq(gameRewardsTable.processed, false));

    // Signal Hunt tokens
    const signalHuntStats = await ctx.db
      .select({
        totalEarned: sum(signalHuntPlayersTable.tokensEarned),
        totalPlayers: count(),
      })
      .from(signalHuntPlayersTable);

    // Signal Hunt completions
    const completionStats = await ctx.db
      .select({
        totalTokensFromCompletions: sum(
          signalHuntCompletionsTable.tokensEarned
        ),
        totalCompletions: count(),
      })
      .from(signalHuntCompletionsTable);

    // Tokens required for claims
    const claimTokensRequired = await ctx.db
      .select({
        totalRequired: sum(claimableItemsTable.tokensRequired),
        totalItems: count(),
      })
      .from(claimableItemsTable);

    return {
      gameRewards: {
        totalDistributed: Number(gameRewardsStats[0]?.totalDistributed) || 0,
        processedAmount: Number(processedRewards[0]?.processedAmount) || 0,
        pendingAmount: Number(pendingRewards[0]?.pendingAmount) || 0,
        totalTransactions: gameRewardsStats[0]?.totalTransactions || 0,
      },
      signalHunt: {
        totalEarned: Number(signalHuntStats[0]?.totalEarned) || 0,
        totalPlayers: signalHuntStats[0]?.totalPlayers || 0,
        totalFromCompletions:
          Number(completionStats[0]?.totalTokensFromCompletions) || 0,
        totalCompletions: completionStats[0]?.totalCompletions || 0,
      },
      claims: {
        totalTokensRequired: Number(claimTokensRequired[0]?.totalRequired) || 0,
        totalItems: claimTokensRequired[0]?.totalItems || 0,
      },
    };
  }),

  // Get token distribution by game
  getDistributionByGame: publicProcedure.query(async ({ ctx }) => {
    const gameDistribution = await ctx.db
      .select({
        game: gameRewardsTable.game,
        totalAmount: sum(gameRewardsTable.amount),
        transactionCount: count(),
      })
      .from(gameRewardsTable)
      .groupBy(gameRewardsTable.game)
      .orderBy(desc(sum(gameRewardsTable.amount)));

    return gameDistribution.map((game) => ({
      game: game.game,
      totalAmount: Number(game.totalAmount) || 0,
      transactionCount: game.transactionCount,
    }));
  }),

  // Get user token stats
  getUserTokenStats: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      // Game rewards for user
      const userGameRewards = await ctx.db
        .select({
          totalEarned: sum(gameRewardsTable.amount),
          totalTransactions: count(),
        })
        .from(gameRewardsTable)
        .where(eq(gameRewardsTable.walletAddress, input.walletAddress));

      const userProcessedRewards = await ctx.db
        .select({
          processedAmount: sum(gameRewardsTable.amount),
        })
        .from(gameRewardsTable)
        .where(
          and(
            eq(gameRewardsTable.walletAddress, input.walletAddress),
            eq(gameRewardsTable.processed, true)
          )
        );

      const userPendingRewards = await ctx.db
        .select({
          pendingAmount: sum(gameRewardsTable.amount),
        })
        .from(gameRewardsTable)
        .where(
          and(
            eq(gameRewardsTable.walletAddress, input.walletAddress),
            eq(gameRewardsTable.processed, false)
          )
        );

      // Signal hunt stats for user
      const userSignalHuntStats = await ctx.db
        .select()
        .from(signalHuntPlayersTable)
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      // User's game breakdown
      const userGameBreakdown = await ctx.db
        .select({
          game: gameRewardsTable.game,
          totalAmount: sum(gameRewardsTable.amount),
          transactionCount: count(),
        })
        .from(gameRewardsTable)
        .where(eq(gameRewardsTable.walletAddress, input.walletAddress))
        .groupBy(gameRewardsTable.game)
        .orderBy(desc(sum(gameRewardsTable.amount)));

      return {
        walletAddress: input.walletAddress,
        gameRewards: {
          totalEarned: Number(userGameRewards[0]?.totalEarned) || 0,
          processedAmount:
            Number(userProcessedRewards[0]?.processedAmount) || 0,
          pendingAmount: Number(userPendingRewards[0]?.pendingAmount) || 0,
          totalTransactions: userGameRewards[0]?.totalTransactions || 0,
        },
        signalHunt: {
          tokensEarned: userSignalHuntStats[0]?.tokensEarned || 0,
          signalsFound: userSignalHuntStats[0]?.signalsFound || 0,
          perfectRhythms: userSignalHuntStats[0]?.perfectRhythms || 0,
        },
        gameBreakdown: userGameBreakdown.map((game) => ({
          game: game.game,
          totalAmount: Number(game.totalAmount) || 0,
          transactionCount: game.transactionCount,
        })),
      };
    }),

  // Get token flow over time
  getTokenFlow: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const tokenFlow = await ctx.db
        .select({
          date: gameRewardsTable.createdAt,
          amount: sum(gameRewardsTable.amount),
          count: count(),
        })
        .from(gameRewardsTable)
        .where(gte(gameRewardsTable.createdAt, startDate))
        .groupBy(gameRewardsTable.createdAt)
        .orderBy(gameRewardsTable.createdAt);

      return tokenFlow.map((flow) => ({
        date: flow.date,
        amount: Number(flow.amount) || 0,
        transactionCount: flow.count,
      }));
    }),

  // Get top token holders
  getTopHolders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const topHolders = await ctx.db
        .select({
          walletAddress: gameRewardsTable.walletAddress,
          totalEarned: sum(gameRewardsTable.amount),
          transactionCount: count(),
        })
        .from(gameRewardsTable)
        .groupBy(gameRewardsTable.walletAddress)
        .orderBy(desc(sum(gameRewardsTable.amount)))
        .limit(input.limit);

      return topHolders.map((holder, index) => ({
        rank: index + 1,
        walletAddress: holder.walletAddress,
        totalEarned: Number(holder.totalEarned) || 0,
        transactionCount: holder.transactionCount,
      }));
    }),

  // Get claim statistics
  getClaimStats: publicProcedure.query(async ({ ctx }) => {
    const totalClaims = await ctx.db
      .select({
        count: count(),
      })
      .from(userClaimsTable);

    const claimsByStatus = await ctx.db
      .select({
        status: userClaimsTable.status,
        count: count(),
      })
      .from(userClaimsTable)
      .groupBy(userClaimsTable.status);

    const topClaimedItems = await ctx.db
      .select({
        itemId: userClaimsTable.itemId,
        itemTitle: claimableItemsTable.title,
        tokensRequired: claimableItemsTable.tokensRequired,
        claimCount: count(),
      })
      .from(userClaimsTable)
      .innerJoin(
        claimableItemsTable,
        eq(claimableItemsTable.id, userClaimsTable.itemId)
      )
      .groupBy(
        userClaimsTable.itemId,
        claimableItemsTable.title,
        claimableItemsTable.tokensRequired
      )
      .orderBy(desc(count()))
      .limit(10);

    return {
      totalClaims: totalClaims[0]?.count || 0,
      claimsByStatus: claimsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, {} as Record<string, number>),
      topClaimedItems: topClaimedItems.map((item) => ({
        itemId: item.itemId,
        itemTitle: item.itemTitle,
        tokensRequired: item.tokensRequired || 0,
        claimCount: item.claimCount,
      })),
    };
  }),
});
