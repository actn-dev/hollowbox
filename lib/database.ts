import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Ensure this only runs on the server
if (typeof window !== "undefined") {
  throw new Error("Database client should only be used on the server side")
}

export const sql = neon(process.env.DATABASE_URL, {
  disableWarningInBrowsers: true,
})
