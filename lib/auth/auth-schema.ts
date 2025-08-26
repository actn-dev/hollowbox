import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

const createTable = sqliteTableCreator((name) => name);

export const user = createTable(
  "user",
  (d) => ({
    id: d.text().primaryKey(),
    name: d.text().notNull(),
    email: d.text().notNull(),
    emailVerified: d.integer({ mode: "boolean" }).notNull(),
    image: d.text(),
    createdAt: d.integer({ mode: "timestamp" }).notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).notNull(),
    // Custom Stellar fields
    stellarPublicKey: d.text(),
    isCustodial: d.integer({ mode: "boolean" }).default(false),
  }),
  (t) => [index("email_idx").on(t.email)]
);

export const session = createTable(
  "session",
  (d) => ({
    id: d.text().primaryKey(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    token: d.text().notNull(),
    createdAt: d.integer({ mode: "timestamp" }).notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).notNull(),
    ipAddress: d.text(),
    userAgent: d.text(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Custom login type field
    loginType: d.text(),
  }),
  (t) => [index("token_idx").on(t.token)]
);

export const account = createTable(
  "account",
  (d) => ({
    id: d.text().primaryKey(),
    accountId: d.text().notNull(),
    providerId: d.text().notNull(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: d.text(),
    refreshToken: d.text(),
    idToken: d.text(),
    accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
    refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
    scope: d.text(),
    password: d.text(),
    createdAt: d.integer({ mode: "timestamp" }).notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).notNull(),
  }),
  (t) => [index("account_provider_idx").on(t.accountId, t.providerId)]
);

export const verification = createTable(
  "verification",
  (d) => ({
    id: d.text().primaryKey(),
    identifier: d.text().notNull(),
    value: d.text().notNull(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    createdAt: d.integer({ mode: "timestamp" }),
    updatedAt: d.integer({ mode: "timestamp" }),
  }),
  (t) => [index("identifier_idx").on(t.identifier)]
);

export const jwks = createTable("jwks", (d) => ({
  id: d.text().primaryKey(),
  publicKey: d.text().notNull(),
  privateKey: d.text().notNull(),
  createdAt: d.integer({ mode: "timestamp" }).notNull(),
}));
