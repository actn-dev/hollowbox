import { postRouter } from "~/server/api/routers/post";
import { bugReportsRouter } from "~/server/api/routers/bug-reports";
import { claimRouter } from "~/server/api/routers/claim";
import { gameRewardsRouter } from "~/server/api/routers/game-rewards";
import { signalHuntRouter } from "~/server/api/routers/signal-hunt";
import { profitTrackerRouter } from "~/server/api/routers/profit-tracker";
import { watchlistRouter } from "~/server/api/routers/watchlist";
import { tiersRouter } from "~/server/api/routers/tiers";
import { adminRouter } from "~/server/api/routers/admin";
import { monitoringRouter } from "~/server/api/routers/monitoring";
import { tokenStatsRouter } from "~/server/api/routers/token-stats";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  bugReports: bugReportsRouter,
  claim: claimRouter,
  gameRewards: gameRewardsRouter,
  signalHunt: signalHuntRouter,
  profitTracker: profitTrackerRouter,
  watchlist: watchlistRouter,
  tiers: tiersRouter,
  admin: adminRouter,
  monitoring: monitoringRouter,
  tokenStats: tokenStatsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
