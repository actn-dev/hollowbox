import { z } from "zod";
import { eq, desc } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { bugReportsTable } from "~/server/db/schema/other";

export const bugReportsRouter = createTRPCRouter({
  // Create a new bug report
  create: publicProcedure
    .input(
      z.object({
        userWallet: z.string().max(100).optional(),
        title: z.string().min(1).max(255),
        description: z.string().min(1),
        pageUrl: z.string().max(500).optional(),
        browserInfo: z.string().optional(),
        severity: z
          .enum(["low", "medium", "high", "critical"])
          .default("medium"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(bugReportsTable)
        .values({
          userWallet: input.userWallet,
          title: input.title,
          description: input.description,
          pageUrl: input.pageUrl,
          browserInfo: input.browserInfo,
          severity: input.severity,
        })
        .returning();

      return {
        success: true,
        bugReport: result[0],
      };
    }),

  // Get all bug reports (admin only)
  getAll: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["open", "closed", "in-progress"])
          .optional()
          .default("open"),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db
        .select()
        .from(bugReportsTable)
        .where(
          input.status ? eq(bugReportsTable.status, input.status) : undefined
        )
        .orderBy(desc(bugReportsTable.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return reports;
    }),

  // Update bug report status (admin only)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["open", "closed", "in-progress"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(bugReportsTable)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(bugReportsTable.id, input.id))
        .returning();

      return {
        success: true,
        bugReport: result[0],
      };
    }),

  // Get bug report by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const report = await ctx.db
        .select()
        .from(bugReportsTable)
        .where(eq(bugReportsTable.id, input.id));

      return report[0] ?? null;
    }),
});
