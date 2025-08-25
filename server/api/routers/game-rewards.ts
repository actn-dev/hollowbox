import { z } from "zod";
import { eq, desc, sum, count } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { gameRewardsTable } from "~/server/db/schema/other";

export const gameRewardsRouter = createTRPCRouter({
  // Get user's game rewards balance
  getBalance: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          totalEarned: sum(gameRewardsTable.amount),
          totalProcessed: sum(gameRewardsTable.amount).where(
            eq(gameRewardsTable.processed, true)
          ),
          pendingRewards: sum(gameRewardsTable.amount).where(
            eq(gameRewardsTable.processed, false)
          ),
        })
        .from(gameRewardsTable)
        .where(eq(gameRewardsTable.walletAddress, input.walletAddress));

      return {
        totalEarned: Number(result[0]?.totalEarned) || 0,
        totalProcessed: Number(result[0]?.totalProcessed) || 0,
        pendingRewards: Number(result[0]?.pendingRewards) || 0,
      };
    }),

  // Earn game rewards
  earn: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        game: z.string().max(50),
        gameType: z.string().max(50).optional(),
        amount: z.number().min(1),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(gameRewardsTable)
        .values({
          walletAddress: input.walletAddress,
          game: input.game,
          gameType: input.gameType,
          amount: input.amount,
          metadata: JSON.stringify(input.metadata || {}),
        })
        .returning();

      return {
        success: true,
        reward: result[0],
      };
    }),

  // Get user's reward history
  getHistory: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        game: z.string().max(50).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const rewards = await ctx.db
        .select()
        .from(gameRewardsTable)
        .where(
          input.game
            ? eq(gameRewardsTable.game, input.game)
            : eq(gameRewardsTable.walletAddress, input.walletAddress)
        )
        .orderBy(desc(gameRewardsTable.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rewards;
    }),

  // Process rewards (admin only) - mark as claimed/processed
  processRewards: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        amount: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If no amount specified, process all pending rewards
      const query = ctx.db
        .update(gameRewardsTable)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(
          eq(gameRewardsTable.walletAddress, input.walletAddress)
          // Add amount condition if specified
        );

      const result = await query.returning();

      return {
        success: true,
        processedRewards: result,
      };
    }),

  // Get all pending rewards (admin only)
  getPendingRewards: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const rewards = await ctx.db
        .select()
        .from(gameRewardsTable)
        .where(eq(gameRewardsTable.processed, false))
        .orderBy(desc(gameRewardsTable.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return rewards;
    }),

  // Get rewards statistics (admin only)
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await ctx.db
      .select({
        totalRewards: sum(gameRewardsTable.amount),
        totalProcessed: sum(gameRewardsTable.amount).where(
          eq(gameRewardsTable.processed, true)
        ),
        totalPending: sum(gameRewardsTable.amount).where(
          eq(gameRewardsTable.processed, false)
        ),
        totalUsers: count(gameRewardsTable.walletAddress).distinct(),
        totalTransactions: count(gameRewardsTable.id),
      })
      .from(gameRewardsTable);

    return {
      totalRewards: Number(stats[0]?.totalRewards) || 0,
      totalProcessed: Number(stats[0]?.totalProcessed) || 0,
      totalPending: Number(stats[0]?.totalPending) || 0,
      totalUsers: Number(stats[0]?.totalUsers) || 0,
      totalTransactions: Number(stats[0]?.totalTransactions) || 0,
    };
  }),
});
