import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { tierConfigTable } from "~/server/db/schema/other";
import { desc, eq } from "drizzle-orm";

export const tiersRouter = createTRPCRouter({
  getTiers: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(tierConfigTable)
      .orderBy(desc(tierConfigTable.tierLevel));
  }),

  createTier: protectedProcedure
    .input(
      z.object({
        tierLevel: z.number(),
        tierName: z.string(),
        tokenRequirement: z.number(),
        tierColor: z.string().optional(),
        tierBgColor: z.string().optional(),
        tierBorderColor: z.string().optional(),
        tierIcon: z.string().optional(),
        benefits: z.array(z.string()),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(tierConfigTable).values(input).returning();
    }),

  updateTier: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tierLevel: z.number().optional(),
        tierName: z.string().optional(),
        tokenRequirement: z.number().optional(),
        tierColor: z.string().optional(),
        tierBgColor: z.string().optional(),
        tierBorderColor: z.string().optional(),
        tierIcon: z.string().optional(),
        benefits: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return ctx.db
        .update(tierConfigTable)
        .set(updateData)
        .where(eq(tierConfigTable.id, id))
        .returning();
    }),
});
