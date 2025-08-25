import { z } from "zod";
import { eq, desc, asc } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { tierConfigTable } from "~/server/db/schema/other";

export const tiersRouter = createTRPCRouter({
  // Get all tiers
  getAll: publicProcedure.query(async ({ ctx }) => {
    const tiers = await ctx.db
      .select()
      .from(tierConfigTable)
      .where(eq(tierConfigTable.isActive, true))
      .orderBy(asc(tierConfigTable.tierLevel));

    return tiers;
  }),

  // Get tier by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tier = await ctx.db
        .select()
        .from(tierConfigTable)
        .where(eq(tierConfigTable.id, input.id));

      return tier[0] ?? null;
    }),

  // Get tier by level
  getByLevel: publicProcedure
    .input(z.object({ level: z.number() }))
    .query(async ({ ctx, input }) => {
      const tier = await ctx.db
        .select()
        .from(tierConfigTable)
        .where(eq(tierConfigTable.tierLevel, input.level));

      return tier[0] ?? null;
    }),

  // Get user's tier based on token amount
  getUserTier: publicProcedure
    .input(z.object({ tokenAmount: z.number() }))
    .query(async ({ ctx, input }) => {
      const tiers = await ctx.db
        .select()
        .from(tierConfigTable)
        .where(eq(tierConfigTable.isActive, true))
        .orderBy(desc(tierConfigTable.tokenRequirement));

      // Find the highest tier the user qualifies for
      const userTier = tiers.find(
        (tier) => input.tokenAmount >= tier.tokenRequirement
      );

      return userTier ?? null;
    }),

  // Create new tier (admin only)
  create: protectedProcedure
    .input(
      z.object({
        tierLevel: z.number().min(1),
        tierName: z.string().min(1).max(100),
        tokenRequirement: z.number().min(0),
        tierColor: z.string().max(50).default("text-gray-400"),
        tierBgColor: z.string().max(50).default("bg-gray-400/10"),
        tierBorderColor: z.string().max(50).default("border-gray-400/20"),
        tierIcon: z.string().max(50).default("Circle"),
        benefits: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if tier level already exists
      const existing = await ctx.db
        .select()
        .from(tierConfigTable)
        .where(eq(tierConfigTable.tierLevel, input.tierLevel));

      if (existing.length > 0) {
        throw new Error("Tier level already exists");
      }

      const result = await ctx.db
        .insert(tierConfigTable)
        .values({
          ...input,
          benefits: JSON.stringify(input.benefits),
        })
        .returning();

      return {
        success: true,
        tier: result[0],
      };
    }),

  // Update tier (admin only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tierLevel: z.number().min(1).optional(),
        tierName: z.string().min(1).max(100).optional(),
        tokenRequirement: z.number().min(0).optional(),
        tierColor: z.string().max(50).optional(),
        tierBgColor: z.string().max(50).optional(),
        tierBorderColor: z.string().max(50).optional(),
        tierIcon: z.string().max(50).optional(),
        benefits: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, benefits, ...updateData } = input;

      const result = await ctx.db
        .update(tierConfigTable)
        .set({
          ...updateData,
          benefits: benefits ? JSON.stringify(benefits) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(tierConfigTable.id, id))
        .returning();

      return {
        success: true,
        tier: result[0],
      };
    }),

  // Delete tier (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Instead of hard delete, set as inactive
      const result = await ctx.db
        .update(tierConfigTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(tierConfigTable.id, input.id))
        .returning();

      return {
        success: true,
        tier: result[0],
      };
    }),

  // Get tier statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const allTiers = await ctx.db.select().from(tierConfigTable);

    const activeTiers = allTiers.filter((tier) => tier.isActive);
    const inactiveTiers = allTiers.filter((tier) => !tier.isActive);

    return {
      totalTiers: allTiers.length,
      activeTiers: activeTiers.length,
      inactiveTiers: inactiveTiers.length,
      tierLevels: activeTiers
        .map((tier) => ({
          level: tier.tierLevel,
          name: tier.tierName,
          requirement: tier.tokenRequirement,
        }))
        .sort((a, b) => a.level - b.level),
    };
  }),

  // Bulk update tier requirements (admin only)
  bulkUpdateRequirements: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          tokenRequirement: z.number().min(0),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const results = [];

      for (const tier of input) {
        const result = await ctx.db
          .update(tierConfigTable)
          .set({
            tokenRequirement: tier.tokenRequirement,
            updatedAt: new Date(),
          })
          .where(eq(tierConfigTable.id, tier.id))
          .returning();

        results.push(result[0]);
      }

      return {
        success: true,
        updatedTiers: results,
      };
    }),
});
