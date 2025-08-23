import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!, {
  disableWarningInBrowsers: true,
})

// Input validation helper
function validateDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not configured")
  }
}

// Rate limiting helper (simple in-memory store for demo)
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 60 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(identifier)

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }

  if (userRequests.count >= RATE_LIMIT) {
    return false
  }

  userRequests.count++
  return true
}

export async function GET(request: Request) {
  try {
    // Validate environment
    validateDatabaseConnection()

    // Basic rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      )
    }

    // Create tables if they don't exist (with proper error handling)
    await sql`
      CREATE TABLE IF NOT EXISTS profit_tracker_wallets (
        id SERIAL PRIMARY KEY,
        address VARCHAR(56) NOT NULL UNIQUE CHECK (length(address) = 56),
        name VARCHAR(255) NOT NULL CHECK (length(name) > 0),
        color VARCHAR(7) NOT NULL CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS profit_tracker_snapshots (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(56) NOT NULL CHECK (length(wallet_address) = 56),
        current_balances JSONB DEFAULT '{}',
        total_hollowvox_sold DECIMAL(20,7) DEFAULT 0 CHECK (total_hollowvox_sold >= 0),
        total_xlm_received DECIMAL(20,7) DEFAULT 0 CHECK (total_xlm_received >= 0),
        average_sell_price DECIMAL(20,7) DEFAULT 0 CHECK (average_sell_price >= 0),
        estimated_profit DECIMAL(20,7) DEFAULT 0 CHECK (estimated_profit >= 0),
        action_fund_allocation DECIMAL(20,7) DEFAULT 0 CHECK (action_fund_allocation >= 0),
        impact_fund_allocation DECIMAL(20,7) DEFAULT 0 CHECK (impact_fund_allocation >= 0),
        total_liquidity_provided DECIMAL(20,7) DEFAULT 0 CHECK (total_liquidity_provided >= 0),
        transaction_count INTEGER DEFAULT 0 CHECK (transaction_count >= 0),
        last_transaction_date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES profit_tracker_wallets(address) ON DELETE CASCADE
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS profit_tracker_transactions (
        id VARCHAR(64) PRIMARY KEY CHECK (length(id) > 0),
        wallet_address VARCHAR(56) NOT NULL CHECK (length(wallet_address) = 56),
        transaction_date DATE NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('trade', 'payment', 'liquidity')),
        hollowvox_amount DECIMAL(20,7) DEFAULT 0 CHECK (hollowvox_amount >= 0),
        xlm_amount DECIMAL(20,7) DEFAULT 0 CHECK (xlm_amount >= 0),
        price DECIMAL(20,7) DEFAULT 0 CHECK (price >= 0),
        issuer VARCHAR(56),
        counterparty VARCHAR(56),
        pool_shares DECIMAL(20,7) CHECK (pool_shares IS NULL OR pool_shares >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wallet_address) REFERENCES profit_tracker_wallets(address) ON DELETE CASCADE
      )
    `

    // Insert default wallet configurations with validation
    const defaultWallets = [
      {
        address: "GC3XYCFXLX26RS34VMEZNVOMWXHBQ3AKPVPAEKK3OSRHB4X56CPXTU52",
        name: "Primary Sales Wallet",
        color: "#00ff76",
        description: "Main HOLLOWVOX token distribution wallet",
      },
      {
        address: "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA",
        name: "Secondary Sales Wallet",
        color: "#ff6b00",
        description: "Additional HOLLOWVOX token sales wallet + Liquidity Provider",
      },
    ]

    for (const wallet of defaultWallets) {
      // Validate Stellar address format
      if (!/^G[A-Z2-7]{55}$/.test(wallet.address)) {
        console.error(`Invalid Stellar address format: ${wallet.address}`)
        continue
      }

      await sql`
        INSERT INTO profit_tracker_wallets (address, name, color, description)
        VALUES (${wallet.address}, ${wallet.name}, ${wallet.color}, ${wallet.description})
        ON CONFLICT (address) DO NOTHING
      `
    }

    console.log("📊 Fetching profit tracker data from database...")

    // Get wallet configurations with latest snapshots (with limits to prevent large queries)
    const wallets = await sql`
      SELECT 
        w.address, w.name, w.color, w.description,
        s.current_balances, s.total_hollowvox_sold, s.total_xlm_received,
        s.average_sell_price, s.estimated_profit, s.action_fund_allocation,
        s.impact_fund_allocation, s.total_liquidity_provided, s.transaction_count,
        s.last_transaction_date, s.created_at as last_updated
      FROM profit_tracker_wallets w
      LEFT JOIN profit_tracker_snapshots s ON w.address = s.wallet_address
      ORDER BY w.id
      LIMIT 10
    `

    const walletData = []

    for (const wallet of wallets) {
      // Validate wallet data
      if (!wallet.address || !/^G[A-Z2-7]{55}$/.test(wallet.address)) {
        console.error(`Invalid wallet address in database: ${wallet.address}`)
        continue
      }

      // Get recent transactions for this wallet (limited to prevent large queries)
      const transactions = await sql`
        SELECT 
          id, transaction_date, transaction_type, hollowvox_amount,
          xlm_amount, price, issuer, counterparty, pool_shares
        FROM profit_tracker_transactions
        WHERE wallet_address = ${wallet.address}
        ORDER BY transaction_date DESC
        LIMIT 10
      `

      const recentTransactions = transactions.map((tx: any) => ({
        id: tx.id,
        date: new Date(tx.transaction_date).toLocaleDateString(),
        type: tx.transaction_type,
        hollowvoxAmount: Number(tx.hollowvox_amount || 0),
        xlmAmount: Number(tx.xlm_amount || 0),
        price: Number(tx.price || 0),
        issuer: tx.issuer,
        counterparty: tx.counterparty,
        poolShares: tx.pool_shares ? Number(tx.pool_shares) : undefined,
      }))

      walletData.push({
        address: wallet.address,
        name: wallet.name || "Unknown Wallet",
        color: wallet.color || "#ffffff",
        description: wallet.description || "",
        currentBalances: wallet.current_balances || {},
        totalHollowvoxSold: Number(wallet.total_hollowvox_sold || 0),
        totalXlmReceived: Number(wallet.total_xlm_received || 0),
        averageSellPrice: Number(wallet.average_sell_price || 0),
        estimatedProfit: Number(wallet.estimated_profit || 0),
        actionFundAllocation: Number(wallet.action_fund_allocation || 0),
        impactFundAllocation: Number(wallet.impact_fund_allocation || 0),
        totalLiquidityProvided: Number(wallet.total_liquidity_provided || 0),
        transactionCount: Number(wallet.transaction_count || 0),
        lastTransactionDate: wallet.last_transaction_date || "No transactions",
        recentTransactions,
        lastUpdated: wallet.last_updated ? new Date(wallet.last_updated).toLocaleString() : "Never updated",
        isStreaming: false,
      })
    }

    // Calculate combined metrics with validation
    const combinedProfit = walletData.reduce((sum, wallet) => sum + (wallet.estimatedProfit || 0), 0)
    const combinedActionFund = walletData.reduce((sum, wallet) => sum + (wallet.actionFundAllocation || 0), 0)
    const combinedImpactFund = walletData.reduce((sum, wallet) => sum + (wallet.impactFundAllocation || 0), 0)
    const combinedLiquidity = walletData.reduce((sum, wallet) => sum + (wallet.totalLiquidityProvided || 0), 0)
    const totalTransactions = walletData.reduce((sum, wallet) => sum + (wallet.transactionCount || 0), 0)

    const responseData = {
      wallets: walletData,
      combinedProfit: Math.max(0, combinedProfit),
      combinedActionFund: Math.max(0, combinedActionFund),
      combinedImpactFund: Math.max(0, combinedImpactFund),
      combinedLiquidity: Math.max(0, combinedLiquidity),
      totalTransactions: Math.max(0, totalTransactions),
      isLiveStreaming: false,
      lastRefresh: new Date().toLocaleString(),
      refreshId: `db-${Date.now()}`,
    }

    console.log("✅ Successfully fetched profit tracker data from database")

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error("❌ Error fetching profit tracker data:", error)

    // Don't expose internal error details to client
    const errorMessage =
      error instanceof Error && error.message.includes("DATABASE_URL")
        ? "Database configuration error"
        : "Failed to fetch profit tracker data"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
