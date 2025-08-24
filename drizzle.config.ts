import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./server/db/schema/index.ts",
  dialect: "turso",
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  // tablesFilter: ["action-auth-starter_*"],
} satisfies Config;
