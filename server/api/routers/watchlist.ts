import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { watchlistTable, suspiciousLogsTable } from "~/server/db/schema/other";

export const watchlistRouter = createTRPCRouter({
  // Get all watched wallets
  getWatchlist: protectedProcedure
    .input(
      z.object({
        status: z.enum(["passive", "active"]).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const watchedWallets = await ctx.db
        .select()
        .from(watchlistTable)
        .where(
          input.status ? eq(watchlistTable.status, input.status) : undefined
        )
        .orderBy(desc(watchlistTable.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      return watchedWallets;
    }),

  // Add wallet to watchlist
  addToWatchlist: protectedProcedure
    .input(
      z.object({
        wallet: z.string().max(56),
        status: z.enum(["passive", "active"]).default("active"),
        createdBy: z.string().max(255).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if wallet is already in watchlist
      const existing = await ctx.db
        .select()
        .from(watchlistTable)
        .where(eq(watchlistTable.wallet, input.wallet));

      if (existing.length > 0) {
        throw new Error("Wallet is already in watchlist");
      }

      const result = await ctx.db
        .insert(watchlistTable)
        .values(input)
        .returning();

      return {
        success: true,
        watchedWallet: result[0],
      };
    }),

  // Update watchlist entry
  updateWatchlist: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["passive", "active"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const result = await ctx.db
        .update(watchlistTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(watchlistTable.id, id))
        .returning();

      return {
        success: true,
        watchedWallet: result[0],
      };
    }),

  // Remove wallet from watchlist
  removeFromWatchlist: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(watchlistTable)
        .where(eq(watchlistTable.id, input.id));

      return { success: true };
    }),

  // Get suspicious logs
  getSuspiciousLogs: protectedProcedure
    .input(
      z.object({
        wallet: z.string().max(56).optional(),
        processed: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.wallet) {
        conditions.push(eq(suspiciousLogsTable.wallet, input.wallet));
      }

      if (input.processed !== undefined) {
        conditions.push(eq(suspiciousLogsTable.processed, input.processed));
      }

      const logs = await ctx.db
        .select()
        .from(suspiciousLogsTable)
        .where(conditions.length > 0 ? conditions[0] : undefined)
        .orderBy(desc(suspiciousLogsTable.receivedAt))
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),

  // Add suspicious log
  addSuspiciousLog: protectedProcedure
    .input(
      z.object({
        wallet: z.string().max(56),
        type: z.string().max(50),
        asset: z.string().max(50),
        amount: z.string().max(50),
        timestamp: z.date(),
        transactionHash: z.string().max(64),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(suspiciousLogsTable)
        .values(input)
        .returning();

      return {
        success: true,
        log: result[0],
      };
    }),

  // Mark suspicious log as processed
  markLogProcessed: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(suspiciousLogsTable)
        .set({ processed: true })
        .where(eq(suspiciousLogsTable.id, input.id))
        .returning();

      return {
        success: true,
        log: result[0],
      };
    }),

  // Check if wallet is being watched
  isWatched: publicProcedure
    .input(z.object({ wallet: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const watched = await ctx.db
        .select()
        .from(watchlistTable)
        .where(eq(watchlistTable.wallet, input.wallet));

      return {
        isWatched: watched.length > 0,
        status: watched[0]?.status || null,
      };
    }),

  // Get watchlist statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const totalWatched = await ctx.db.select().from(watchlistTable);

    const activeWatched = await ctx.db
      .select()
      .from(watchlistTable)
      .where(eq(watchlistTable.status, "active"));

    const unprocessedLogs = await ctx.db
      .select()
      .from(suspiciousLogsTable)
      .where(eq(suspiciousLogsTable.processed, false));

    return {
      totalWatched: totalWatched.length,
      activeWatched: activeWatched.length,
      passiveWatched: totalWatched.length - activeWatched.length,
      unprocessedLogs: unprocessedLogs.length,
    };
  }),
});
