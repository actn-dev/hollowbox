import {
  boolean,
  decimal,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
  bigint,
} from "drizzle-orm/pg-core";

// Bug Reports Tables
export const bugReportsTable = pgTable("bug_reports", {
  id: serial("id").primaryKey(),
  userWallet: varchar("user_wallet", { length: 100 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  pageUrl: varchar("page_url", { length: 500 }),
  browserInfo: text("browser_info"),
  severity: varchar("severity", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Claim System Tables
export const claimableItemsTable = pgTable("claimable_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  tokensRequired: integer("tokens_required").notNull().default(0),
  category: varchar("category", { length: 50 }).notNull().default("digital"),
  claimsRemaining: integer("claims_remaining"), // NULL means unlimited
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // From add-expiration-to-claims.sql
  expirationDate: timestamp("expiration_date", { withTimezone: true }), // From add-expiration-to-claims.sql
  winnerAnnounced: boolean("winner_announced").default(false),
  winnerAnnouncedAt: timestamp("winner_announced_at", { withTimezone: true }),
});

export const userClaimsTable = pgTable("user_claims", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => claimableItemsTable.id, { onDelete: "cascade" }),
  walletAddress: varchar("wallet_address", { length: 56 }).notNull(), // Stellar addresses are 56 characters
  userName: varchar("user_name", { length: 255 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  userAddress: text("user_address"), // Shipping address for physical items
  userPhone: varchar("user_phone", { length: 50 }),
  userNotes: text("user_notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Profit Tracker Tables
export const profitTrackerWalletsTable = pgTable("profit_tracker_wallets", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 56 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profitTrackerSnapshotsTable = pgTable("profit_tracker_snapshots", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 56 })
    .notNull()
    .references(() => profitTrackerWalletsTable.address),
  currentBalances: json("current_balances").default({}),
  totalHollowvoxSold: decimal("total_hollowvox_sold", {
    precision: 20,
    scale: 7,
  }).default("0"),
  totalXlmReceived: decimal("total_xlm_received", {
    precision: 20,
    scale: 7,
  }).default("0"),
  averageSellPrice: decimal("average_sell_price", {
    precision: 20,
    scale: 7,
  }).default("0"),
  estimatedProfit: decimal("estimated_profit", {
    precision: 20,
    scale: 7,
  }).default("0"),
  actionFundAllocation: decimal("action_fund_allocation", {
    precision: 20,
    scale: 7,
  }).default("0"),
  impactFundAllocation: decimal("impact_fund_allocation", {
    precision: 20,
    scale: 7,
  }).default("0"),
  totalLiquidityProvided: decimal("total_liquidity_provided", {
    precision: 20,
    scale: 7,
  }).default("0"),
  transactionCount: integer("transaction_count").default(0),
  lastTransactionDate: varchar("last_transaction_date", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profitTrackerTransactionsTable = pgTable(
  "profit_tracker_transactions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    walletAddress: varchar("wallet_address", { length: 56 })
      .notNull()
      .references(() => profitTrackerWalletsTable.address),
    transactionDate: timestamp("transaction_date").notNull(),
    transactionType: varchar("transaction_type", { length: 20 }).notNull(), // 'trade', 'payment', 'liquidity'
    hollowvoxAmount: decimal("hollowvox_amount", {
      precision: 20,
      scale: 7,
    }).default("0"),
    xlmAmount: decimal("xlm_amount", { precision: 20, scale: 7 }).default("0"),
    price: decimal("price", { precision: 20, scale: 7 }).default("0"),
    issuer: varchar("issuer", { length: 56 }),
    counterparty: varchar("counterparty", { length: 56 }),
    poolShares: decimal("pool_shares", { precision: 20, scale: 7 }),
    createdAt: timestamp("created_at").defaultNow(),
  }
);

// Watchlist Tables
export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 56 }).notNull().unique(),
  status: varchar("status", { length: 10 }).notNull(), // 'passive', 'active'
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
  notes: text("notes"),
});

export const suspiciousLogsTable = pgTable("suspicious_logs", {
  id: serial("id").primaryKey(),
  wallet: varchar("wallet", { length: 56 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  asset: varchar("asset", { length: 50 }).notNull(),
  amount: varchar("amount", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  transactionHash: varchar("transaction_hash", { length: 64 }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow(),
  processed: boolean("processed").default(false),
});

// Tier Config Tables
export const tierConfigTable = pgTable("tier_config", {
  id: serial("id").primaryKey(),
  tierLevel: integer("tier_level").notNull().unique(),
  tierName: varchar("tier_name", { length: 100 }).notNull(),
  tokenRequirement: bigint("token_requirement", { mode: "number" }).notNull(),
  tierColor: varchar("tier_color", { length: 50 })
    .notNull()
    .default("text-gray-400"),
  tierBgColor: varchar("tier_bg_color", { length: 50 })
    .notNull()
    .default("bg-gray-400/10"),
  tierBorderColor: varchar("tier_border_color", { length: 50 })
    .notNull()
    .default("border-gray-400/20"),
  tierIcon: varchar("tier_icon", { length: 50 }).notNull().default("Circle"),
  benefits: text("benefits").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Signal Hunt Game Tables
export const signalHuntPlayersTable = pgTable("signal_hunt_players", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 56 }).notNull().unique(),
  scansUsed: integer("scans_used").default(0),
  maxScans: integer("max_scans").default(3),
  tokensEarned: integer("tokens_earned").default(0),
  signalsFound: integer("signals_found").default(0),
  perfectRhythms: integer("perfect_rhythms").default(0),
  loreUnlocked: integer("lore_unlocked").default(0),
  lastScanTime: timestamp("last_scan_time").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const signalHuntFoundSignalsTable = pgTable(
  "signal_hunt_found_signals",
  {
    id: serial("id").primaryKey(),
    walletAddress: varchar("wallet_address", { length: 56 })
      .notNull()
      .references(() => signalHuntPlayersTable.walletAddress, {
        onDelete: "cascade",
      }),
    signalId: varchar("signal_id", { length: 100 }).notNull().unique(),
    signalType: varchar("signal_type", { length: 20 }).notNull(), // 'rhythm', 'lore', 'token', 'rare'
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    reward: integer("reward").notNull(),
    xPosition: decimal("x_position", { precision: 5, scale: 2 }).notNull(),
    yPosition: decimal("y_position", { precision: 5, scale: 2 }).notNull(),
    completed: boolean("completed").default(false),
    completionScore: integer("completion_score"),
    createdAt: timestamp("created_at").defaultNow(),
  }
);

export const signalHuntCompletionsTable = pgTable("signal_hunt_completions", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 56 })
    .notNull()
    .references(() => signalHuntPlayersTable.walletAddress, {
      onDelete: "cascade",
    }),
  signalId: varchar("signal_id", { length: 100 }).notNull(),
  signalType: varchar("signal_type", { length: 20 }).notNull(),
  score: integer("score").notNull(),
  perfect: boolean("perfect").default(false),
  tokensEarned: integer("tokens_earned").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game Rewards Tables (from add-created-at-to-game-rewards.sql)
export const gameRewardsTable = pgTable("game_rewards", {
  id: serial("id").primaryKey(),
  walletAddress: varchar("wallet_address", { length: 56 }).notNull(),
  game: varchar("game", { length: 50 }).notNull(),
  gameType: varchar("game_type", { length: 50 }), // From the script modifications
  amount: integer("amount").notNull(),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  metadata: json("metadata").default({}), // From add-created-at-to-game-rewards.sql
});

// Define types for each table
export type InsertBugReport = typeof bugReportsTable.$inferInsert;
export type SelectBugReport = typeof bugReportsTable.$inferSelect;

export type InsertClaimableItem = typeof claimableItemsTable.$inferInsert;
export type SelectClaimableItem = typeof claimableItemsTable.$inferSelect;

export type InsertUserClaim = typeof userClaimsTable.$inferInsert;
export type SelectUserClaim = typeof userClaimsTable.$inferSelect;

export type InsertProfitTrackerWallet =
  typeof profitTrackerWalletsTable.$inferInsert;
export type SelectProfitTrackerWallet =
  typeof profitTrackerWalletsTable.$inferSelect;

export type InsertProfitTrackerSnapshot =
  typeof profitTrackerSnapshotsTable.$inferInsert;
export type SelectProfitTrackerSnapshot =
  typeof profitTrackerSnapshotsTable.$inferSelect;

export type InsertProfitTrackerTransaction =
  typeof profitTrackerTransactionsTable.$inferInsert;
export type SelectProfitTrackerTransaction =
  typeof profitTrackerTransactionsTable.$inferSelect;

export type InsertWatchlist = typeof watchlistTable.$inferInsert;
export type SelectWatchlist = typeof watchlistTable.$inferSelect;

export type InsertSuspiciousLog = typeof suspiciousLogsTable.$inferInsert;
export type SelectSuspiciousLog = typeof suspiciousLogsTable.$inferSelect;

export type InsertTierConfig = typeof tierConfigTable.$inferInsert;
export type SelectTierConfig = typeof tierConfigTable.$inferSelect;

export type InsertSignalHuntPlayer = typeof signalHuntPlayersTable.$inferInsert;
export type SelectSignalHuntPlayer = typeof signalHuntPlayersTable.$inferSelect;

export type InsertSignalHuntFoundSignal =
  typeof signalHuntFoundSignalsTable.$inferInsert;
export type SelectSignalHuntFoundSignal =
  typeof signalHuntFoundSignalsTable.$inferSelect;

export type InsertSignalHuntCompletion =
  typeof signalHuntCompletionsTable.$inferInsert;
export type SelectSignalHuntCompletion =
  typeof signalHuntCompletionsTable.$inferSelect;

export type InsertGameReward = typeof gameRewardsTable.$inferInsert;
export type SelectGameReward = typeof gameRewardsTable.$inferSelect;
