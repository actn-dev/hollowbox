import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

export const createTable = sqliteTableCreator((name) => name);

// Bug Reports Tables
export const bugReportsTable = createTable(
  "bug_reports",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userWallet: d.text("user_wallet", { length: 100 }),
    title: d.text("title", { length: 255 }).notNull(),
    description: d.text("description").notNull(),
    pageUrl: d.text("page_url", { length: 500 }),
    browserInfo: d.text("browser_info"),
    severity: d.text("severity", { length: 20 }).default("medium"),
    status: d.text("status", { length: 20 }).default("open"),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("idx_bug_reports_status").on(t.status),
    index("idx_bug_reports_created_at").on(t.createdAt),
  ]
);

// Claim System Tables
export const claimableItemsTable = createTable(
  "claimable_items",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: d.text("title", { length: 255 }).notNull(),
    description: d.text("description"),
    imageUrl: d.text("image_url"),
    tokensRequired: d.integer("tokens_required").notNull().default(0),
    category: d.text("category", { length: 50 }).notNull().default("digital"),
    claimsRemaining: d.integer("claims_remaining"), // NULL means unlimited
    isActive: d
      .integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: d.integer("expires_at", { mode: "timestamp" }), // From add-expiration-to-claims.sql
    expirationDate: d.integer("expiration_date", { mode: "timestamp" }), // From add-expiration-to-claims.sql
    winnerAnnounced: d
      .integer("winner_announced", { mode: "boolean" })
      .default(false),
    winnerAnnouncedAt: d.integer("winner_announced_at", { mode: "timestamp" }),
  }),
  (t) => [
    index("idx_claimable_items_active").on(t.isActive),
    index("idx_claimable_items_category").on(t.category),
    index("idx_claimable_items_expiration").on(t.expirationDate),
    index("idx_claimable_items_winner_announced").on(t.winnerAnnounced),
  ]
);

export const userClaimsTable = createTable(
  "user_claims",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    itemId: d
      .text("item_id")
      .notNull()
      .references(() => claimableItemsTable.id, { onDelete: "cascade" }),
    walletAddress: d.text("wallet_address", { length: 56 }).notNull(), // Stellar addresses are 56 characters
    userName: d.text("user_name", { length: 255 }).notNull(),
    userEmail: d.text("user_email", { length: 255 }).notNull(),
    userAddress: d.text("user_address"), // Shipping address for physical items
    userPhone: d.text("user_phone", { length: 50 }),
    userNotes: d.text("user_notes"),
    status: d.text("status", { length: 50 }).notNull().default("pending"),
    claimedAt: d
      .integer("claimed_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("idx_user_claims_wallet").on(t.walletAddress),
    index("idx_user_claims_item").on(t.itemId),
    index("idx_user_claims_status").on(t.status),
  ]
);

// Profit Tracker Tables
export const profitTrackerWalletsTable = createTable(
  "profit_tracker_wallets",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    address: d.text("address", { length: 56 }).notNull().unique(),
    name: d.text("name", { length: 255 }).notNull(),
    color: d.text("color", { length: 7 }).notNull(),
    description: d.text("description"),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [index("idx_profit_tracker_wallets_address").on(t.address)]
);

export const profitTrackerSnapshotsTable = createTable(
  "profit_tracker_snapshots",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletAddress: d
      .text("wallet_address", { length: 56 })
      .notNull()
      .references(() => profitTrackerWalletsTable.address),
    currentBalances: d.text("current_balances", { mode: "json" }).default("{}"),
    totalHollowvoxSold: d.real("total_hollowvox_sold").default(0),
    totalXlmReceived: d.real("total_xlm_received").default(0),
    averageSellPrice: d.real("average_sell_price").default(0),
    estimatedProfit: d.real("estimated_profit").default(0),
    actionFundAllocation: d.real("action_fund_allocation").default(0),
    impactFundAllocation: d.real("impact_fund_allocation").default(0),
    totalLiquidityProvided: d.real("total_liquidity_provided").default(0),
    transactionCount: d.integer("transaction_count").default(0),
    lastTransactionDate: d.text("last_transaction_date", { length: 50 }),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [index("idx_profit_tracker_snapshots_wallet").on(t.walletAddress)]
);

export const profitTrackerTransactionsTable = createTable(
  "profit_tracker_transactions",
  (d) => ({
    id: d.text("id", { length: 64 }).primaryKey(),
    walletAddress: d
      .text("wallet_address", { length: 56 })
      .notNull()
      .references(() => profitTrackerWalletsTable.address),
    transactionDate: d
      .integer("transaction_date", { mode: "timestamp" })
      .notNull(),
    transactionType: d.text("transaction_type", { length: 20 }).notNull(), // 'trade', 'payment', 'liquidity'
    hollowvoxAmount: d.real("hollowvox_amount").default(0),
    xlmAmount: d.real("xlm_amount").default(0),
    price: d.real("price").default(0),
    issuer: d.text("issuer", { length: 56 }),
    counterparty: d.text("counterparty", { length: 56 }),
    poolShares: d.real("pool_shares"),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("idx_profit_tracker_transactions_wallet").on(t.walletAddress),
    index("idx_profit_tracker_transactions_date").on(t.transactionDate),
  ]
);

// Watchlist Tables
export const watchlistTable = createTable(
  "watchlist",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    wallet: d.text("wallet", { length: 56 }).notNull().unique(),
    status: d.text("status", { length: 10 }).notNull(), // 'passive', 'active'
    addedAt: d
      .integer("added_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdBy: d.text("created_by", { length: 255 }),
    notes: d.text("notes"),
  }),
  (t) => [
    index("idx_watchlist_wallet").on(t.wallet),
    index("idx_watchlist_status").on(t.status),
    index("idx_watchlist_updated_at").on(t.updatedAt),
  ]
);

export const suspiciousLogsTable = createTable(
  "suspicious_logs",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    wallet: d.text("wallet", { length: 56 }).notNull(),
    type: d.text("type", { length: 50 }).notNull(),
    asset: d.text("asset", { length: 50 }).notNull(),
    amount: d.text("amount", { length: 50 }).notNull(),
    timestamp: d.integer("timestamp", { mode: "timestamp" }).notNull(),
    transactionHash: d.text("transaction_hash", { length: 64 }).notNull(),
    receivedAt: d
      .integer("received_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    processed: d.integer("processed", { mode: "boolean" }).default(false),
  }),
  (t) => [
    index("idx_suspicious_logs_wallet").on(t.wallet),
    index("idx_suspicious_logs_received_at").on(t.receivedAt),
    index("idx_suspicious_logs_processed").on(t.processed),
  ]
);

// Tier Config Tables
export const tierConfigTable = createTable(
  "tier_config",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tierLevel: d.integer("tier_level").notNull().unique(),
    tierName: d.text("tier_name", { length: 100 }).notNull(),
    tokenRequirement: d.integer("token_requirement").notNull(),
    tierColor: d
      .text("tier_color", { length: 50 })
      .notNull()
      .default("text-gray-400"),
    tierBgColor: d
      .text("tier_bg_color", { length: 50 })
      .notNull()
      .default("bg-gray-400/10"),
    tierBorderColor: d
      .text("tier_border_color", { length: 50 })
      .notNull()
      .default("border-gray-400/20"),
    tierIcon: d.text("tier_icon", { length: 50 }).notNull().default("Circle"),
    benefits: d.text("benefits", { mode: "json" }).notNull().default("[]"),
    isActive: d
      .integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("idx_tier_config_level").on(t.tierLevel),
    index("idx_tier_config_active").on(t.isActive),
  ]
);

// Signal Hunt Game Tables
export const signalHuntPlayersTable = createTable(
  "signal_hunt_players",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletAddress: d.text("wallet_address", { length: 56 }).notNull().unique(),
    scansUsed: d.integer("scans_used").default(0),
    maxScans: d.integer("max_scans").default(3),
    tokensEarned: d.integer("tokens_earned").default(0),
    signalsFound: d.integer("signals_found").default(0),
    perfectRhythms: d.integer("perfect_rhythms").default(0),
    loreUnlocked: d.integer("lore_unlocked").default(0),
    lastScanTime: d
      .integer("last_scan_time", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: d
      .integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [index("idx_signal_hunt_players_wallet").on(t.walletAddress)]
);

export const signalHuntFoundSignalsTable = createTable(
  "signal_hunt_found_signals",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletAddress: d
      .text("wallet_address", { length: 56 })
      .notNull()
      .references(() => signalHuntPlayersTable.walletAddress, {
        onDelete: "cascade",
      }),
    signalId: d.text("signal_id", { length: 100 }).notNull().unique(),
    signalType: d.text("signal_type", { length: 20 }).notNull(), // 'rhythm', 'lore', 'token', 'rare'
    title: d.text("title", { length: 200 }).notNull(),
    description: d.text("description"),
    reward: d.integer("reward").notNull(),
    xPosition: d.real("x_position").notNull(),
    yPosition: d.real("y_position").notNull(),
    completed: d.integer("completed", { mode: "boolean" }).default(false),
    completionScore: d.integer("completion_score"),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("idx_signal_hunt_found_signals_wallet").on(t.walletAddress),
    index("idx_signal_hunt_found_signals_signal_id").on(t.signalId),
  ]
);

export const signalHuntCompletionsTable = createTable(
  "signal_hunt_completions",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletAddress: d
      .text("wallet_address", { length: 56 })
      .notNull()
      .references(() => signalHuntPlayersTable.walletAddress, {
        onDelete: "cascade",
      }),
    signalId: d.text("signal_id", { length: 100 }).notNull(),
    signalType: d.text("signal_type", { length: 20 }).notNull(),
    score: d.integer("score").notNull(),
    perfect: d.integer("perfect", { mode: "boolean" }).default(false),
    tokensEarned: d.integer("tokens_earned").notNull(),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  }),
  (t) => [
    index("idx_signal_hunt_completions_wallet").on(t.walletAddress),
    index("idx_signal_hunt_completions_signal").on(t.signalId),
  ]
);

// Game Rewards Tables (from add-created-at-to-game-rewards.sql)
export const gameRewardsTable = createTable(
  "game_rewards",
  (d) => ({
    id: d
      .text({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletAddress: d.text("wallet_address", { length: 56 }).notNull(),
    game: d.text("game", { length: 50 }).notNull(),
    gameType: d.text("game_type", { length: 50 }), // From the script modifications
    amount: d.integer("amount").notNull(),
    processed: d.integer("processed", { mode: "boolean" }).default(false),
    processedAt: d.integer("processed_at", { mode: "timestamp" }),
    createdAt: d
      .integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    metadata: d.text("metadata", { mode: "json" }).default("{}"), // From add-created-at-to-game-rewards.sql
  }),
  (t) => [
    index("idx_game_rewards_wallet").on(t.walletAddress),
    index("idx_game_rewards_game").on(t.game),
    index("idx_game_rewards_created_at").on(t.createdAt),
    index("idx_game_rewards_wallet_game_type_created").on(
      t.walletAddress,
      t.gameType,
      t.createdAt
    ),
  ]
);

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
