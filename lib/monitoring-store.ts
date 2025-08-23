import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface SuspiciousLog {
  id?: number
  wallet: string
  type: string
  asset: string
  amount: string
  timestamp: string
  transaction_hash: string
  received_at: string
  processed?: boolean
}

export interface WatchlistEntry {
  id?: number
  wallet: string
  status: "passive" | "active"
  added_at: string
  updated_at: string
  created_by?: string
  notes?: string
}

export const monitoringStore = {
  // Suspicious logs methods
  async addSuspiciousLog(log: Omit<SuspiciousLog, "received_at" | "id">): Promise<SuspiciousLog> {
    const result = await sql`
      INSERT INTO suspicious_logs (wallet, type, asset, amount, timestamp, transaction_hash)
      VALUES (${log.wallet}, ${log.type}, ${log.asset}, ${log.amount}, ${log.timestamp}, ${log.transaction_hash})
      RETURNING *
    `
    return result[0] as SuspiciousLog
  },

  async getSuspiciousLogs(): Promise<SuspiciousLog[]> {
    const result = await sql`
      SELECT * FROM suspicious_logs 
      ORDER BY received_at DESC
    `
    return result as SuspiciousLog[]
  },

  async clearSuspiciousLogs(): Promise<void> {
    await sql`DELETE FROM suspicious_logs`
  },

  // Watchlist methods
  async getWatchlist(): Promise<WatchlistEntry[]> {
    const result = await sql`
      SELECT * FROM watchlist 
      ORDER BY updated_at DESC
    `
    return result as WatchlistEntry[]
  },

  async addWatchlistEntry(
    wallet: string,
    status: "passive" | "active",
    createdBy?: string,
    notes?: string,
  ): Promise<WatchlistEntry> {
    const result = await sql`
      INSERT INTO watchlist (wallet, status, created_by, notes)
      VALUES (${wallet}, ${status}, ${createdBy || null}, ${notes || null})
      ON CONFLICT (wallet) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        updated_at = NOW(),
        created_by = COALESCE(EXCLUDED.created_by, watchlist.created_by),
        notes = COALESCE(EXCLUDED.notes, watchlist.notes)
      RETURNING *
    `
    return result[0] as WatchlistEntry
  },

  async updateWatchlistEntry(wallet: string, status: "passive" | "active"): Promise<WatchlistEntry | null> {
    const result = await sql`
      UPDATE watchlist 
      SET status = ${status}, updated_at = NOW()
      WHERE wallet = ${wallet}
      RETURNING *
    `
    return (result[0] as WatchlistEntry) || null
  },

  async removeWatchlistEntry(wallet: string): Promise<WatchlistEntry | null> {
    const result = await sql`
      DELETE FROM watchlist 
      WHERE wallet = ${wallet}
      RETURNING *
    `
    return (result[0] as WatchlistEntry) || null
  },

  async getWatchlistEntry(wallet: string): Promise<WatchlistEntry | null> {
    const result = await sql`
      SELECT * FROM watchlist 
      WHERE wallet = ${wallet}
    `
    return (result[0] as WatchlistEntry) || null
  },

  async getStats() {
    const [logsResult, watchlistResult, activeResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM suspicious_logs`,
      sql`SELECT COUNT(*) as count FROM watchlist`,
      sql`SELECT COUNT(*) as count FROM watchlist WHERE status = 'active'`,
    ])

    return {
      totalLogs: Number(logsResult[0].count),
      monitoredWallets: Number(watchlistResult[0].count),
      activeThreats: Number(activeResult[0].count),
    }
  },
}
