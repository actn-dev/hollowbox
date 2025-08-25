import { z } from "zod";
import { eq, desc, sum, count, and, sql } from "drizzle-orm";

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
import { stellarService, StellarService } from "~/lib/stellar-service";
import { db } from "~/server/db";

export const profitTrackerRouter = createTRPCRouter({
  // Get profit tracker data with aggregations
  getData: publicProcedure.query(async ({ ctx }) => {
    console.log(
      "hi hello.....ee dlfsjflksd flskfjs;ldfjs;dlkj;sldfkjlk........."
    );
    // Ensure default wallets exist
    await seedDefaultWallets(ctx.db);

    // Get all wallets with their latest snapshots
    const walletsData = await ctx.db
      .select({
        // Wallet info
        address: profitTrackerWalletsTable.address,
        name: profitTrackerWalletsTable.name,
        color: profitTrackerWalletsTable.color,
        description: profitTrackerWalletsTable.description,
        // Latest snapshot data
        currentBalances: profitTrackerSnapshotsTable.currentBalances,
        totalHollowvoxSold: profitTrackerSnapshotsTable.totalHollowvoxSold,
        totalXlmReceived: profitTrackerSnapshotsTable.totalXlmReceived,
        averageSellPrice: profitTrackerSnapshotsTable.averageSellPrice,
        estimatedProfit: profitTrackerSnapshotsTable.estimatedProfit,
        actionFundAllocation: profitTrackerSnapshotsTable.actionFundAllocation,
        impactFundAllocation: profitTrackerSnapshotsTable.impactFundAllocation,
        totalLiquidityProvided:
          profitTrackerSnapshotsTable.totalLiquidityProvided,
        transactionCount: profitTrackerSnapshotsTable.transactionCount,
        lastTransactionDate: profitTrackerSnapshotsTable.lastTransactionDate,
        lastUpdated: profitTrackerSnapshotsTable.createdAt,
      })
      .from(profitTrackerWalletsTable)
      .leftJoin(
        profitTrackerSnapshotsTable,
        eq(
          profitTrackerWalletsTable.address,
          profitTrackerSnapshotsTable.walletAddress
        )
      )
      .orderBy(desc(profitTrackerWalletsTable.createdAt));

    // Get recent transactions for each wallet
    const walletsWithTransactions = await Promise.all(
      walletsData.map(async (wallet) => {
        const recentTransactions = await ctx.db
          .select()
          .from(profitTrackerTransactionsTable)
          .where(
            eq(profitTrackerTransactionsTable.walletAddress, wallet.address)
          )
          .orderBy(desc(profitTrackerTransactionsTable.transactionDate))
          .limit(10);

        return {
          ...wallet,
          currentBalances: wallet.currentBalances
            ? JSON.parse(wallet.currentBalances as string)
            : {},
          totalHollowvoxSold: Number(wallet.totalHollowvoxSold || 0),
          totalXlmReceived: Number(wallet.totalXlmReceived || 0),
          averageSellPrice: Number(wallet.averageSellPrice || 0),
          estimatedProfit: Number(wallet.estimatedProfit || 0),
          actionFundAllocation: Number(wallet.actionFundAllocation || 0),
          impactFundAllocation: Number(wallet.impactFundAllocation || 0),
          totalLiquidityProvided: Number(wallet.totalLiquidityProvided || 0),
          transactionCount: Number(wallet.transactionCount || 0),
          recentTransactions: recentTransactions.map((tx) => ({
            id: tx.id,
            date: new Date(tx.transactionDate).toISOString(),
            type: tx.transactionType,
            hollowvoxAmount: Number(tx.hollowvoxAmount || 0),
            xlmAmount: Number(tx.xlmAmount || 0),
            price: Number(tx.price || 0),
            counterparty: tx.counterparty,
            poolShares: tx.poolShares ? Number(tx.poolShares) : undefined,
          })),
        };
      })
    );

    // Calculate combined metrics
    const combinedProfit = walletsWithTransactions.reduce(
      (sum, wallet) => sum + wallet.estimatedProfit,
      0
    );
    const combinedActionFund = walletsWithTransactions.reduce(
      (sum, wallet) => sum + wallet.actionFundAllocation,
      0
    );
    const combinedImpactFund = walletsWithTransactions.reduce(
      (sum, wallet) => sum + wallet.impactFundAllocation,
      0
    );
    const combinedLiquidity = walletsWithTransactions.reduce(
      (sum, wallet) => sum + wallet.totalLiquidityProvided,
      0
    );
    const totalTransactions = walletsWithTransactions.reduce(
      (sum, wallet) => sum + wallet.transactionCount,
      0
    );

    // Get the most recent update time
    const lastRefresh = walletsWithTransactions.reduce((latest, wallet) => {
      if (!wallet.lastUpdated) return latest;
      const walletTime = new Date(wallet.lastUpdated).getTime();
      return walletTime > latest ? walletTime : latest;
    }, 0);

    return {
      wallets: walletsWithTransactions,
      combinedProfit: Math.max(0, combinedProfit),
      combinedActionFund: Math.max(0, combinedActionFund),
      combinedImpactFund: Math.max(0, combinedImpactFund),
      combinedLiquidity: Math.max(0, combinedLiquidity),
      totalTransactions: Math.max(0, totalTransactions),
      lastRefresh:
        lastRefresh > 0 ? new Date(lastRefresh).toLocaleString() : "Never",
      isLiveStreaming: false,
    };
  }),

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

  // Update data from Stellar network
  updateFromStellar: publicProcedure
    .input(
      z
        .object({
          walletAddress: z.string().max(56).optional(),
        })
        .optional()
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get wallets to update
        let walletsToUpdate: Array<{ address: string; name: string }>;

        if (input?.walletAddress) {
          // Update specific wallet
          const wallet = await ctx.db
            .select()
            .from(profitTrackerWalletsTable)
            .where(eq(profitTrackerWalletsTable.address, input.walletAddress))
            .limit(1);

          if (wallet.length === 0) {
            throw new Error(`Wallet ${input.walletAddress} not found`);
          }
          walletsToUpdate = [
            { address: wallet[0].address, name: wallet[0].name },
          ];
        } else {
          // Update all wallets
          const allWallets = await ctx.db
            .select({
              address: profitTrackerWalletsTable.address,
              name: profitTrackerWalletsTable.name,
            })
            .from(profitTrackerWalletsTable);
          walletsToUpdate = allWallets;
        }

        const updateResults = [];

        for (const wallet of walletsToUpdate) {
          try {
            // Fetch fresh data from Stellar
            const stellarData = await stellarService.analyzeWalletActivity(
              wallet.address
            );

            if (stellarData.error) {
              updateResults.push({
                wallet: wallet.name,
                success: false,
                error: stellarData.error,
              });
              continue;
            }

            // Upsert snapshot data - first try to update, then insert if not exists
            const existingSnapshot = await ctx.db
              .select()
              .from(profitTrackerSnapshotsTable)
              .where(
                eq(profitTrackerSnapshotsTable.walletAddress, wallet.address)
              )
              .limit(1);

            if (existingSnapshot.length > 0) {
              // Update existing snapshot
              await ctx.db
                .update(profitTrackerSnapshotsTable)
                .set({
                  currentBalances: JSON.stringify(stellarData.currentBalances),
                  totalHollowvoxSold: stellarData.totalHollowvoxSold,
                  totalXlmReceived: stellarData.totalXlmReceived,
                  averageSellPrice: stellarData.averageSellPrice,
                  estimatedProfit: stellarData.estimatedProfit,
                  actionFundAllocation: stellarData.actionFundAllocation,
                  impactFundAllocation: stellarData.impactFundAllocation,
                  totalLiquidityProvided: stellarData.totalLiquidityProvided,
                  transactionCount: stellarData.transactionCount,
                  lastTransactionDate: stellarData.lastTransactionDate,
                  createdAt: new Date(),
                })
                .where(
                  eq(profitTrackerSnapshotsTable.walletAddress, wallet.address)
                );
            } else {
              // Insert new snapshot
              await ctx.db.insert(profitTrackerSnapshotsTable).values({
                walletAddress: wallet.address,
                currentBalances: JSON.stringify(stellarData.currentBalances),
                totalHollowvoxSold: stellarData.totalHollowvoxSold,
                totalXlmReceived: stellarData.totalXlmReceived,
                averageSellPrice: stellarData.averageSellPrice,
                estimatedProfit: stellarData.estimatedProfit,
                actionFundAllocation: stellarData.actionFundAllocation,
                impactFundAllocation: stellarData.impactFundAllocation,
                totalLiquidityProvided: stellarData.totalLiquidityProvided,
                transactionCount: stellarData.transactionCount,
                lastTransactionDate: stellarData.lastTransactionDate,
              });
            }

            // Update/insert recent transactions
            for (const tx of stellarData.recentTransactions) {
              await ctx.db
                .insert(profitTrackerTransactionsTable)
                .values({
                  id: tx.id,
                  walletAddress: wallet.address,
                  transactionDate: new Date(tx.date),
                  transactionType: tx.type as "trade" | "payment" | "liquidity",
                  hollowvoxAmount: tx.hollowvoxAmount,
                  xlmAmount: tx.xlmAmount,
                  price: tx.price,
                  counterparty: tx.counterparty,
                  poolShares: tx.poolShares,
                })
                .onConflictDoNothing();
            }

            updateResults.push({
              wallet: wallet.name,
              success: true,
              transactions: stellarData.recentTransactions.length,
            });
          } catch (error) {
            updateResults.push({
              wallet: wallet.name,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        const successfulUpdates = updateResults.filter((r) => r.success).length;
        const failedUpdates = updateResults.filter((r) => !r.success).length;

        return {
          success: failedUpdates === 0,
          message: `Updated ${successfulUpdates} wallets${
            failedUpdates > 0 ? `, ${failedUpdates} failed` : ""
          }`,
          updatedWallets: successfulUpdates,
          results: updateResults,
        };
      } catch (error) {
        console.error("Error updating from Stellar:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to update from Stellar"
        );
      }
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

// Helper function to seed default wallets
async function seedDefaultWallets(database: typeof db) {
  const defaultWallets = StellarService.getDefaultWallets();

  for (const wallet of defaultWallets) {
    // Validate Stellar address format
    if (!StellarService.isValidStellarAddress(wallet.address)) {
      console.error(`Invalid Stellar address format: ${wallet.address}`);
      continue;
    }

    try {
      await database
        .insert(profitTrackerWalletsTable)
        .values(wallet)
        .onConflictDoNothing();
    } catch (error) {
      console.error(`Error seeding wallet ${wallet.address}:`, error);
    }
  }
}
