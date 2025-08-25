import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  profitTrackerWalletsTable,
  profitTrackerSnapshotsTable,
  profitTrackerTransactionsTable,
} from "~/server/db/schema/other";

export const profitTrackerRouter = createTRPCRouter({
  // Get wallet data
  getWallets: protectedProcedure.query(async ({ ctx }) => {
    const wallets = await ctx.db
      .select()
      .from(profitTrackerWalletsTable)
      .orderBy(desc(profitTrackerWalletsTable.createdAt));

    return wallets;
  }),

  // Add new wallet
  addWallet: protectedProcedure
    .input(
      z.object({
        address: z.string().max(56),
        name: z.string().min(1).max(255),
        color: z.string().max(7),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(profitTrackerWalletsTable)
        .values(input)
        .returning();

      return {
        success: true,
        wallet: result[0],
      };
    }),

  // Update wallet
  updateWallet: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        color: z.string().max(7).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const result = await ctx.db
        .update(profitTrackerWalletsTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(profitTrackerWalletsTable.id, id))
        .returning();

      return {
        success: true,
        wallet: result[0],
      };
    }),

  // Delete wallet
  deleteWallet: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(profitTrackerWalletsTable)
        .where(eq(profitTrackerWalletsTable.id, input.id));

      return { success: true };
    }),

  // Get snapshots for a wallet
  getSnapshots: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const snapshots = await ctx.db
        .select()
        .from(profitTrackerSnapshotsTable)
        .where(
          eq(profitTrackerSnapshotsTable.walletAddress, input.walletAddress)
        )
        .orderBy(desc(profitTrackerSnapshotsTable.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return snapshots;
    }),

  // Create new snapshot
  createSnapshot: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        currentBalances: z.record(z.any()).optional(),
        totalHollowvoxSold: z.number().optional(),
        totalXlmReceived: z.number().optional(),
        averageSellPrice: z.number().optional(),
        estimatedProfit: z.number().optional(),
        actionFundAllocation: z.number().optional(),
        impactFundAllocation: z.number().optional(),
        totalLiquidityProvided: z.number().optional(),
        transactionCount: z.number().optional(),
        lastTransactionDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(profitTrackerSnapshotsTable)
        .values({
          ...input,
          currentBalances: JSON.stringify(input.currentBalances || {}),
        })
        .returning();

      return {
        success: true,
        snapshot: result[0],
      };
    }),

  // Get transactions for a wallet
  getTransactions: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.db
        .select()
        .from(profitTrackerTransactionsTable)
        .where(
          eq(profitTrackerTransactionsTable.walletAddress, input.walletAddress)
        )
        .orderBy(desc(profitTrackerTransactionsTable.transactionDate))
        .limit(input.limit)
        .offset(input.offset);

      return transactions;
    }),

  // Add new transaction
  addTransaction: protectedProcedure
    .input(
      z.object({
        id: z.string().max(64),
        walletAddress: z.string().max(56),
        transactionDate: z.date(),
        transactionType: z.enum(["trade", "payment", "liquidity"]),
        hollowvoxAmount: z.number().optional(),
        xlmAmount: z.number().optional(),
        price: z.number().optional(),
        issuer: z.string().max(56).optional(),
        counterparty: z.string().max(56).optional(),
        poolShares: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(profitTrackerTransactionsTable)
        .values(input)
        .returning();

      return {
        success: true,
        transaction: result[0],
      };
    }),

  // Update transaction data (bulk update for existing wallets)
  updateData: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically fetch fresh data from Stellar network
      // For now, we'll just return success
      // In a real implementation, this would:
      // 1. Fetch latest transactions from Stellar
      // 2. Calculate profit metrics
      // 3. Create new snapshot

      return {
        success: true,
        message: "Data update initiated",
        walletAddress: input.walletAddress,
      };
    }),

  // Get debug information
  getDebugInfo: protectedProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const wallet = await ctx.db
        .select()
        .from(profitTrackerWalletsTable)
        .where(eq(profitTrackerWalletsTable.address, input.walletAddress));

      const latestSnapshot = await ctx.db
        .select()
        .from(profitTrackerSnapshotsTable)
        .where(
          eq(profitTrackerSnapshotsTable.walletAddress, input.walletAddress)
        )
        .orderBy(desc(profitTrackerSnapshotsTable.createdAt))
        .limit(1);

      const transactionCount = await ctx.db
        .select()
        .from(profitTrackerTransactionsTable)
        .where(
          eq(profitTrackerTransactionsTable.walletAddress, input.walletAddress)
        );

      return {
        wallet: wallet[0] ?? null,
        latestSnapshot: latestSnapshot[0] ?? null,
        totalTransactions: transactionCount.length,
      };
    }),
});
