import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  claimableItemsTable,
  userClaimsTable,
  type InsertClaimableItem,
  type InsertUserClaim,
} from "~/server/db/schema/other";

export const claimRouter = createTRPCRouter({
  // Get all claimable items
  getItems: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.db
      .select()
      .from(claimableItemsTable)
      .orderBy(desc(claimableItemsTable.createdAt));

    return items;
  }),

  // Get claimable item by ID
  getItemById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db
        .select()
        .from(claimableItemsTable)
        .where(eq(claimableItemsTable.id, input.id));

      return item[0] ?? null;
    }),

  // Create new claimable item (admin only)
  createItem: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        tokensRequired: z.number().min(0),
        category: z.string().min(1).max(50),
        claimsRemaining: z.number().optional(),
        expirationDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(claimableItemsTable)
        .values({
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          tokensRequired: input.tokensRequired,
          category: input.category,
          claimsRemaining: input.claimsRemaining,
          expirationDate: input.expirationDate,
        })
        .returning();

      return {
        success: true,
        item: result[0],
      };
    }),

  // Update claimable item (admin only)
  updateItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        tokensRequired: z.number().min(0).optional(),
        category: z.string().min(1).max(50).optional(),
        claimsRemaining: z.number().optional(),
        isActive: z.boolean().optional(),
        expirationDate: z.date().optional(),
        winnerAnnounced: z.boolean().optional(),
        winnerAnnouncedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const result = await ctx.db
        .update(claimableItemsTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(claimableItemsTable.id, id))
        .returning();

      return {
        success: true,
        item: result[0],
      };
    }),

  // Submit a claim
  submitClaim: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        walletAddress: z.string().max(56),
        userName: z.string().min(1).max(255),
        userEmail: z.string().email().max(255),
        userAddress: z.string().optional(),
        userPhone: z.string().max(50).optional(),
        userNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if item exists and is active
      const item = await ctx.db
        .select()
        .from(claimableItemsTable)
        .where(eq(claimableItemsTable.id, input.itemId));

      if (!item[0] || !item[0].isActive) {
        throw new Error("Item not found or not active");
      }

      // Check if user already claimed this item
      const existingClaim = await ctx.db
        .select()
        .from(userClaimsTable)
        .where(
          and(
            eq(userClaimsTable.itemId, input.itemId),
            eq(userClaimsTable.walletAddress, input.walletAddress)
          )
        );

      if (existingClaim.length > 0) {
        throw new Error("You have already claimed this item");
      }

      // Create the claim
      const result = await ctx.db
        .insert(userClaimsTable)
        .values({
          itemId: input.itemId,
          walletAddress: input.walletAddress,
          userName: input.userName,
          userEmail: input.userEmail,
          userAddress: input.userAddress,
          userPhone: input.userPhone,
          userNotes: input.userNotes,
        })
        .returning();

      return {
        success: true,
        claim: result[0],
      };
    }),

  // Get user claims
  getUserClaims: protectedProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const claims = await ctx.db
        .select({
          id: userClaimsTable.id,
          itemId: userClaimsTable.itemId,
          walletAddress: userClaimsTable.walletAddress,
          userName: userClaimsTable.userName,
          userEmail: userClaimsTable.userEmail,
          userAddress: userClaimsTable.userAddress,
          userPhone: userClaimsTable.userPhone,
          userNotes: userClaimsTable.userNotes,
          status: userClaimsTable.status,
          claimedAt: userClaimsTable.claimedAt,
          // Item details
          itemTitle: claimableItemsTable.title,
          itemDescription: claimableItemsTable.description,
          itemImageUrl: claimableItemsTable.imageUrl,
          itemTokensRequired: claimableItemsTable.tokensRequired,
          itemCategory: claimableItemsTable.category,
        })
        .from(userClaimsTable)
        .innerJoin(
          claimableItemsTable,
          eq(userClaimsTable.itemId, claimableItemsTable.id)
        )
        .where(eq(userClaimsTable.walletAddress, input.walletAddress))
        .orderBy(desc(userClaimsTable.claimedAt));

      return claims;
    }),

  // Get all claims (admin only)
  getAllClaims: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "approved", "rejected", "shipped"])
          .optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const claims = await ctx.db
        .select({
          id: userClaimsTable.id,
          itemId: userClaimsTable.itemId,
          walletAddress: userClaimsTable.walletAddress,
          userName: userClaimsTable.userName,
          userEmail: userClaimsTable.userEmail,
          userAddress: userClaimsTable.userAddress,
          userPhone: userClaimsTable.userPhone,
          userNotes: userClaimsTable.userNotes,
          status: userClaimsTable.status,
          claimedAt: userClaimsTable.claimedAt,
          updatedAt: userClaimsTable.updatedAt,
          // Item details
          itemTitle: claimableItemsTable.title,
          itemDescription: claimableItemsTable.description,
          itemCategory: claimableItemsTable.category,
          itemTokensRequired: claimableItemsTable.tokensRequired,
        })
        .from(userClaimsTable)
        .innerJoin(
          claimableItemsTable,
          eq(userClaimsTable.itemId, claimableItemsTable.id)
        )
        .where(
          input.status ? eq(userClaimsTable.status, input.status) : undefined
        )
        .orderBy(desc(userClaimsTable.claimedAt))
        .limit(input.limit)
        .offset(input.offset);

      return claims;
    }),

  // Update claim status (admin only)
  updateClaimStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "approved", "rejected", "shipped"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(userClaimsTable)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(userClaimsTable.id, input.id))
        .returning();

      return {
        success: true,
        claim: result[0],
      };
    }),

  // Announce winner (admin only)
  announceWinner: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(claimableItemsTable)
        .set({
          winnerAnnounced: true,
          winnerAnnouncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(claimableItemsTable.id, input.itemId))
        .returning();

      return {
        success: true,
        item: result[0],
      };
    }),
});
