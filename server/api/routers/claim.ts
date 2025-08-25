import { z } from "zod";
import { eq, desc, and, count, ne, sql } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { claimableItemsTable, userClaimsTable } from "~/server/db/schema/other";

// Helper function to check Stellar wallet balance
const checkStellarBalance = async (address: string) => {
  const HORIZON_URL = "https://horizon.stellar.org";
  const HVX_ASSET_CODE = "HOLLOWVOX";
  const HVX_ISSUER_ADDRESSES = [
    "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
  ];

  const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (!response.ok) {
    if (response.status === 404) {
      return { totalBalance: 0 }; // Unfunded account
    }
    throw new Error(`Failed to fetch account: ${response.status}`);
  }

  const account = await response.json();
  const hvxBalanceLines =
    account.balances?.filter(
      (balance: any) =>
        balance.asset_type !== "native" &&
        balance.asset_code === HVX_ASSET_CODE &&
        HVX_ISSUER_ADDRESSES.includes(balance.asset_issuer)
    ) || [];

  const totalBalance = hvxBalanceLines.reduce(
    (sum: number, line: any) => sum + parseFloat(line.balance || "0"),
    0
  );

  return { totalBalance };
};

export const claimRouter = createTRPCRouter({
  // Get all claimable items
  getItems: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(claimableItemsTable)
      .orderBy(desc(claimableItemsTable.createdAt));
  }),

  // Check wallet balance and eligibility
  checkBalance: publicProcedure
    .input(z.object({ address: z.string().regex(/^G[A-Z2-7]{55}$/) }))
    .query(async ({ input }) => {
      return checkStellarBalance(input.address);
    }),

  // Create new claimable item (admin only)
  createItem: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        tokensRequired: z.number().min(1),
        category: z.enum(["digital", "physical", "experience"]),
        claimsRemaining: z.number().optional().nullable(),
        expirationDate: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [newItem] = await ctx.db
        .insert(claimableItemsTable)
        .values(input)
        .returning();
      return newItem;
    }),

  // Submit a claim
  submitClaim: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        walletAddress: z.string().regex(/^G[A-Z2-7]{55}$/),
        userInfo: z.object({
          name: z.string().min(1),
          email: z.string().email(),
          address: z.string().optional(),
          phone: z.string().optional(),
          notes: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .select()
        .from(claimableItemsTable)
        .where(eq(claimableItemsTable.id, input.itemId));

      if (!item) throw new Error("Item not found");
      if (!item.isActive) throw new Error("Drawing is not active");
      if (item.winnerAnnounced) throw new Error("Winner already announced");
      if (item.expirationDate && new Date(item.expirationDate) < new Date()) {
        throw new Error("This drawing has expired");
      }

      const [existingClaim] = await ctx.db
        .select()
        .from(userClaimsTable)
        .where(
          and(
            eq(userClaimsTable.itemId, input.itemId),
            eq(userClaimsTable.walletAddress, input.walletAddress)
          )
        );

      if (existingClaim)
        throw new Error("You have already entered this drawing");

      // Server-side balance check and entry calculation
      const { totalBalance } = await checkStellarBalance(input.walletAddress);
      const entries = Math.floor(totalBalance / item.tokensRequired);

      if (entries === 0) {
        throw new Error("Insufficient tokens for a single entry");
      }

      const [newClaim] = await ctx.db
        .insert(userClaimsTable)
        .values({
          itemId: input.itemId,
          walletAddress: input.walletAddress,
          userName: input.userInfo.name,
          userEmail: input.userInfo.email,
          userAddress: input.userInfo.address,
          userPhone: input.userInfo.phone,
          userNotes: input.userInfo.notes,
          entries: entries,
        })
        .returning();

      return newClaim;
    }),

  // Get user's claims for a specific wallet
  getUserClaims: publicProcedure
    .input(z.object({ address: z.string().regex(/^G[A-Z2-7]{55}$/) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(userClaimsTable)
        .where(eq(userClaimsTable.walletAddress, input.address))
        .orderBy(desc(userClaimsTable.claimedAt));
    }),

  // Get all claims and stats (admin only)
  getAdminDashboard: protectedProcedure.query(async ({ ctx }) => {
    try {
      const claimsData = await ctx.db
        .select({
          id: userClaimsTable.id,
          itemId: userClaimsTable.itemId,
          walletAddress: userClaimsTable.walletAddress,
          userName: userClaimsTable.userName,
          userEmail: userClaimsTable.userEmail,
          userAddress: userClaimsTable.userAddress,
          userPhone: userClaimsTable.userPhone,
          userNotes: userClaimsTable.userNotes,
          entries: userClaimsTable.entries,
          status: userClaimsTable.status,
          claimedAt: userClaimsTable.claimedAt,
          itemTitle: claimableItemsTable.title,
        })
        .from(userClaimsTable)
        .innerJoin(
          claimableItemsTable,
          eq(userClaimsTable.itemId, claimableItemsTable.id)
        )
        .orderBy(desc(userClaimsTable.claimedAt));

      const claims = claimsData.map((claim) => ({
        id: claim.id,
        itemId: claim.itemId,
        walletAddress: claim.walletAddress,
        userInfo: {
          name: claim.userName,
          email: claim.userEmail,
          address: claim.userAddress,
          phone: claim.userPhone,
          notes: claim.userNotes,
        },
        entries: claim.entries,
        status: claim.status,
        claimedAt: claim.claimedAt,
        itemTitle: claim.itemTitle,
      }));

      const stats = await ctx.db
        .select({
          totalClaims: count(userClaimsTable.id),
          pendingClaims: count(sql`CASE WHEN status = 'pending' THEN 1 END`),
          approvedClaims: count(sql`CASE WHEN status = 'approved' THEN 1 END`),
          shippedClaims: count(sql`CASE WHEN status = 'shipped' THEN 1 END`),
          completedClaims: count(
            sql`CASE WHEN status = 'completed' THEN 1 END`
          ),
          cancelledClaims: count(
            sql`CASE WHEN status = 'cancelled' THEN 1 END`
          ),
          uniqueUsers: count(sql`DISTINCT wallet_address`),
        })
        .from(userClaimsTable);

      const itemStats = await ctx.db
        .select({
          totalItems: count(claimableItemsTable.id),
          activeItems: count(sql`CASE WHEN is_active = true THEN 1 END`),
          expiredItems: count(
            sql`CASE WHEN expiration_date < unixepoch() THEN 1 END`
          ),
          itemsWithWinners: count(
            sql`CASE WHEN winner_announced = true THEN 1 END`
          ),
        })
        .from(claimableItemsTable);

      return {
        claims,
        stats: {
          ...stats[0],
          ...itemStats[0],
        },
      };
    } catch (e) {
      console.error("Error fetching claims data:", e);
    }
  }),

  // Update claim status (admin only)
  updateClaimStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "pending",
          "approved",
          "shipped",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedClaim] = await ctx.db
        .update(userClaimsTable)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(userClaimsTable.id, input.id))
        .returning();
      return updatedClaim;
    }),

  // Announce winner (admin only)
  announceWinner: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entries = await ctx.db
        .select({
          id: userClaimsTable.id,
          walletAddress: userClaimsTable.walletAddress,
          entries: userClaimsTable.entries,
          userName: userClaimsTable.userName,
        })
        .from(userClaimsTable)
        .where(
          and(
            eq(userClaimsTable.itemId, input.itemId),
            eq(userClaimsTable.status, "pending")
          )
        );

      if (entries.length === 0) {
        throw new Error("No pending entries found for this drawing");
      }

      const weightedEntries: string[] = [];
      entries.forEach((entry) => {
        for (let i = 0; i < entry.entries; i++) {
          weightedEntries.push(entry.id);
        }
      });

      const winnerId =
        weightedEntries[Math.floor(Math.random() * weightedEntries.length)];

      // Update winner
      await ctx.db
        .update(userClaimsTable)
        .set({ status: "approved" })
        .where(eq(userClaimsTable.id, winnerId));

      // Update other participants
      await ctx.db
        .update(userClaimsTable)
        .set({ status: "cancelled" })
        .where(
          and(
            eq(userClaimsTable.itemId, input.itemId),
            ne(userClaimsTable.id, winnerId)
          )
        );

      // Mark item as winner announced
      await ctx.db
        .update(claimableItemsTable)
        .set({ winnerAnnounced: true, winnerAnnouncedAt: new Date() })
        .where(eq(claimableItemsTable.id, input.itemId));

      const winner = entries.find((e) => e.id === winnerId);

      return {
        message: "Winner announced successfully!",
        winner,
      };
    }),
});
