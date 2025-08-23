import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const stellarServerUrl = "https://horizon.stellar.org/"
const sqlClient = neon(process.env.DATABASE_URL!)

// Configuration with validation
const HOLLOWVOX_ASSET_CODE = "HOLLOWVOX"
const HOLLOWVOX_ISSUER = "GAMPLEHPKGQVURMWCZUKGTJKIBEYBDQZQHLY4VEG2JQNVTQR7WJRKGXGR"

// Rate limiting to prevent spam
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 10

  const current = rateLimitMap.get(ip)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

interface StellarTransaction {
  id: string
  hash: string
  created_at: string
  successful: boolean
  operation_count: number
  operations?: Array<{
    type: string
    type_i: number
    asset_code?: string
    asset_issuer?: string
    amount?: string
    from?: string
    to?: string
    buying_asset_code?: string
    buying_asset_issuer?: string
    selling_asset_code?: string
    selling_asset_issuer?: string
  }>
}

interface TradeData {
  totalProfit: number
  actionFund: number
  impactFund: number
  liquidityProvided: number
  totalTrades: number
  recentTransactions: Array<{
    hash: string
    type: string
    amount: string
    asset: string
    timestamp: string
    profit?: number
  }>
}

const getStellarServer = () => {
  const makeRequest = async (url: string): Promise<any> => {
    // Validate URL to prevent SSRF attacks
    if (!url.startsWith(stellarServerUrl)) {
      throw new Error("Invalid Stellar API URL")
    }

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  return {
    loadAccount: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `${stellarServerUrl}accounts/${publicKey}?_t=${timestamp}`
      return await makeRequest(url)
    },

    trades: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `${stellarServerUrl}accounts/${publicKey}/trades?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },

    payments: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `${stellarServerUrl}accounts/${publicKey}/payments?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },

    operations: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `${stellarServerUrl}accounts/${publicKey}/operations?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },
  }
}

const validateStellarAddress = (address: string): boolean => {
  return typeof address === "string" && /^G[A-Z2-7]{55}$/.test(address)
}

const validateNumericValue = (value: any): number => {
  const num = Number(value)
  return isNaN(num) || num < 0 ? 0 : num
}

const sanitizeString = (str: any): string => {
  if (typeof str !== "string") return ""
  return str.slice(0, 1000) // Limit string length
}

export async function POST(request: Request) {
  try {
    // Validate environment
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not configured")
    }

    // Handle request body parsing more safely
    let requestBody = {}
    try {
      const bodyText = await request.text()
      if (bodyText) {
        requestBody = JSON.parse(bodyText)
      }
    } catch (parseError) {
      console.log("No request body or invalid JSON, proceeding with default behavior")
    }

    // Rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { success: false, error: "Update rate limit exceeded. Please try again later." },
        { status: 429 },
      )
    }

    console.log("🔄 Starting profit tracker data update...")

    const { walletAddress } = requestBody

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    console.log(`Updating profit data for wallet: ${walletAddress}`)

    // Fetch transactions from Stellar
    const transactionsUrl = `${stellarServerUrl}accounts/${walletAddress}/transactions?limit=200&order=desc`
    const transactionsResponse = await fetch(transactionsUrl)

    if (!transactionsResponse.ok) {
      throw new Error(`Failed to fetch transactions: ${transactionsResponse.statusText}`)
    }

    const transactionsData = await transactionsResponse.json()
    const transactions: StellarTransaction[] = transactionsData._embedded?.records || []

    console.log(`Found ${transactions.length} transactions`)

    let totalProfit = 0
    let actionFund = 0
    let impactFund = 0
    let liquidityProvided = 0
    let totalTrades = 0
    const recentTransactions: TradeData["recentTransactions"] = []

    // Process each transaction
    for (const transaction of transactions) {
      if (!transaction.successful) continue

      try {
        // Fetch operations for this transaction
        const operationsUrl = `${stellarServerUrl}transactions/${transaction.hash}/operations`
        const operationsResponse = await fetch(operationsUrl)

        if (!operationsResponse.ok) continue

        const operationsData = await operationsResponse.json()
        const operations = operationsData._embedded?.records || []

        // Process operations
        for (const operation of operations) {
          if (operation.type === "path_payment_strict_send" || operation.type === "path_payment_strict_receive") {
            // Check if this involves HOLLOWVOX
            const isHollowvoxSale =
              (operation.selling_asset_code === HOLLOWVOX_ASSET_CODE &&
                operation.selling_asset_issuer === HOLLOWVOX_ISSUER) ||
              (operation.asset_code === HOLLOWVOX_ASSET_CODE && operation.asset_issuer === HOLLOWVOX_ISSUER)

            if (isHollowvoxSale && operation.amount) {
              const amount = Number.parseFloat(operation.amount)
              totalProfit += amount
              totalTrades++

              // Add to recent transactions
              if (recentTransactions.length < 50) {
                // Increased limit
                recentTransactions.push({
                  hash: transaction.hash,
                  type: "HOLLOWVOX Sale",
                  amount: operation.amount,
                  asset: "XLM",
                  timestamp: transaction.created_at,
                  profit: amount,
                })
              }
            }
          } else if (operation.type === "manage_sell_offer" || operation.type === "manage_buy_offer") {
            // Check for HOLLOWVOX trading offers
            const isHollowvoxOffer =
              (operation.selling_asset_code === HOLLOWVOX_ASSET_CODE &&
                operation.selling_asset_issuer === HOLLOWVOX_ISSUER) ||
              (operation.buying_asset_code === HOLLOWVOX_ASSET_CODE &&
                operation.buying_asset_issuer === HOLLOWVOX_ISSUER)

            if (isHollowvoxOffer) {
              totalTrades++

              if (recentTransactions.length < 50) {
                recentTransactions.push({
                  hash: transaction.hash,
                  type: "HOLLOWVOX Trade",
                  amount: operation.amount || "0",
                  asset: "HOLLOWVOX",
                  timestamp: transaction.created_at,
                })
              }
            }
          } else if (operation.type === "change_trust") {
            // Track liquidity provision
            if (operation.asset_code === HOLLOWVOX_ASSET_CODE && operation.asset_issuer === HOLLOWVOX_ISSUER) {
              const limit = Number.parseFloat(operation.limit || "0")
              liquidityProvided += limit
            }
          }
        }
      } catch (operationError) {
        console.error(`Error processing operations for transaction ${transaction.hash}:`, operationError)
        continue
      }
    }

    // Calculate action fund and impact fund (20% of profits each)
    actionFund = totalProfit * 0.2
    impactFund = totalProfit * 0.2

    const tradeData: TradeData = {
      totalProfit,
      actionFund,
      impactFund,
      liquidityProvided,
      totalTrades,
      recentTransactions,
    }

    console.log(`Processed data:`, {
      totalProfit,
      actionFund,
      impactFund,
      liquidityProvided,
      totalTrades,
      transactionCount: recentTransactions.length,
    })

    // Store in database
    await sqlClient`
      INSERT INTO profit_tracker_data (wallet_address, data, updated_at)
      VALUES (${walletAddress}, ${JSON.stringify(tradeData)}, NOW())
      ON CONFLICT (wallet_address) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `

    return NextResponse.json({
      success: true,
      data: tradeData,
      message: `Updated profit data: ${totalTrades} trades processed`,
    })
  } catch (error) {
    console.error("Error updating profit tracker:", error)
    return NextResponse.json({ error: "Failed to update profit data" }, { status: 500 })
  }
}
