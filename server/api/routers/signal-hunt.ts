import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  signalHuntPlayersTable,
  signalHuntFoundSignalsTable,
  signalHuntCompletionsTable,
} from "~/server/db/schema/other";

export const signalHuntRouter = createTRPCRouter({
  // Get or create player stats
  getPlayerStats: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      let player = await ctx.db
        .select()
        .from(signalHuntPlayersTable)
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      // Create player if doesn't exist
      if (player.length === 0) {
        const newPlayer = await ctx.db
          .insert(signalHuntPlayersTable)
          .values({
            walletAddress: input.walletAddress,
          })
          .returning();

        player = newPlayer;
      }

      return player[0]!;
    }),

  // Check daily scan limit
  checkDailyLimit: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const player = await ctx.db
        .select()
        .from(signalHuntPlayersTable)
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      if (!player[0]) {
        return { canScan: true, scansUsed: 0, maxScans: 3 };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if last scan was today
      const lastScanToday = player[0].lastScanTime >= today;

      return {
        canScan: !lastScanToday || player[0].scansUsed < player[0].maxScans,
        scansUsed: lastScanToday ? player[0].scansUsed : 0,
        maxScans: player[0].maxScans,
        lastScanTime: player[0].lastScanTime,
      };
    }),

  // Perform a scan
  scan: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .mutation(async ({ ctx, input }) => {
      // Get or create player
      let player = await ctx.db
        .select()
        .from(signalHuntPlayersTable)
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      // Create player if doesn't exist
      if (player.length === 0) {
        const newPlayer = await ctx.db
          .insert(signalHuntPlayersTable)
          .values({
            walletAddress: input.walletAddress,
          })
          .returning();

        player = newPlayer;
      }

      const playerData = player[0]!;
      const scansUsed = playerData.scansUsed ?? 0;
      const maxScans = playerData.maxScans ?? 3;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastScanToday = playerData.lastScanTime >= today;

      if (lastScanToday && scansUsed >= maxScans) {
        throw new Error("Daily scan limit reached");
      }

      // Update player scan count
      const isNewDay = playerData.lastScanTime < today;
      const newScansUsed = isNewDay ? 1 : scansUsed + 1;

      await ctx.db
        .update(signalHuntPlayersTable)
        .set({
          scansUsed: newScansUsed,
          lastScanTime: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      // Generate random signal (simplified logic)
      const signalTypes = ["rhythm", "lore", "token", "rare"];
      const signalType =
        signalTypes[Math.floor(Math.random() * signalTypes.length)];
      const signalId = `signal_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const rewards = {
        rhythm: 100,
        lore: 200,
        token: 500,
        rare: 1000,
      };

      const signal = {
        signalId,
        signalType,
        title: `${
          signalType.charAt(0).toUpperCase() + signalType.slice(1)
        } Signal`,
        description: `A mysterious ${signalType} signal detected in the void...`,
        reward: rewards[signalType as keyof typeof rewards],
        xPosition: Math.random() * 100,
        yPosition: Math.random() * 100,
      };

      // Save found signal
      await ctx.db.insert(signalHuntFoundSignalsTable).values({
        walletAddress: input.walletAddress,
        signalId: signal.signalId,
        signalType: signal.signalType as any,
        title: signal.title,
        description: signal.description,
        reward: signal.reward,
        xPosition: signal.xPosition,
        yPosition: signal.yPosition,
      });

      return {
        success: true,
        signal,
        scansRemaining: maxScans - newScansUsed,
      };
    }),

  // Complete a rhythm challenge
  completeRhythm: publicProcedure
    .input(
      z.object({
        walletAddress: z.string().max(56),
        signalId: z.string().max(100),
        score: z.number().min(0).max(100),
        perfect: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if signal exists and belongs to user
      const signal = await ctx.db
        .select()
        .from(signalHuntFoundSignalsTable)
        .where(
          and(
            eq(signalHuntFoundSignalsTable.signalId, input.signalId),
            eq(signalHuntFoundSignalsTable.walletAddress, input.walletAddress)
          )
        );

      if (!signal[0]) {
        throw new Error("Signal not found");
      }

      if (signal[0].completed) {
        throw new Error("Signal already completed");
      }

      // Calculate tokens earned based on score
      const baseReward = signal[0].reward;
      const scoreMultiplier = input.score / 100;
      const perfectBonus = input.perfect ? 1.5 : 1;
      const tokensEarned = Math.floor(
        baseReward * scoreMultiplier * perfectBonus
      );

      // Mark signal as completed
      await ctx.db
        .update(signalHuntFoundSignalsTable)
        .set({
          completed: true,
          completionScore: input.score,
        })
        .where(eq(signalHuntFoundSignalsTable.id, signal[0].id));

      // Record completion
      await ctx.db.insert(signalHuntCompletionsTable).values({
        walletAddress: input.walletAddress,
        signalId: input.signalId,
        signalType: signal[0].signalType,
        score: input.score,
        perfect: input.perfect,
        tokensEarned,
      });

      // Update player stats using SQL increments
      await ctx.db
        .update(signalHuntPlayersTable)
        .set({
          tokensEarned: sql`${signalHuntPlayersTable.tokensEarned} + ${tokensEarned}`,
          signalsFound: sql`${signalHuntPlayersTable.signalsFound} + 1`,
          perfectRhythms: input.perfect
            ? sql`${signalHuntPlayersTable.perfectRhythms} + 1`
            : signalHuntPlayersTable.perfectRhythms,
          updatedAt: new Date(),
        })
        .where(eq(signalHuntPlayersTable.walletAddress, input.walletAddress));

      return {
        success: true,
        tokensEarned,
        perfect: input.perfect,
        score: input.score,
      };
    }),

  // Get leaderboard
  getLeaderboard: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(10),
        sortBy: z
          .enum(["tokens", "signals", "perfect"])
          .optional()
          .default("tokens"),
      })
    )
    .query(async ({ ctx, input }) => {
      const orderBy = {
        tokens: desc(signalHuntPlayersTable.tokensEarned),
        signals: desc(signalHuntPlayersTable.signalsFound),
        perfect: desc(signalHuntPlayersTable.perfectRhythms),
      };

      const players = await ctx.db
        .select()
        .from(signalHuntPlayersTable)
        .orderBy(orderBy[input.sortBy])
        .limit(input.limit);

      return players;
    }),

  // Get user's found signals
  getFoundSignals: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const signals = await ctx.db
        .select()
        .from(signalHuntFoundSignalsTable)
        .where(
          eq(signalHuntFoundSignalsTable.walletAddress, input.walletAddress)
        )
        .orderBy(desc(signalHuntFoundSignalsTable.createdAt));

      return signals;
    }),

  // Get user's completions
  getCompletions: publicProcedure
    .input(z.object({ walletAddress: z.string().max(56) }))
    .query(async ({ ctx, input }) => {
      const completions = await ctx.db
        .select()
        .from(signalHuntCompletionsTable)
        .where(
          eq(signalHuntCompletionsTable.walletAddress, input.walletAddress)
        )
        .orderBy(desc(signalHuntCompletionsTable.createdAt));

      return completions;
    }),
});
