import { NextResponse } from "next/server"

// Configuration
const HOLLOWVOX_ASSET_CODE = "HOLLOWVOX"
const HOLLOWVOX_ISSUERS = [
  "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX", // HVX-1
  "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF", // HVX-2
  "GAMPLEHPKGQVURMWCZUKGTJKIBEYBDQZQHLY4VEG2JQNVTQR7WJRKGXGR", // Original issuer
]

function validateStellarAddress(address: string): boolean {
  return typeof address === "string" && /^G[A-Z2-7]{55}$/.test(address)
}

function validateNumericValue(value: any): number {
  const num = Number(value)
  return isNaN(num) || num < 0 ? 0 : num
}

const getStellarServer = () => {
  const makeRequest = async (url: string): Promise<any> => {
    if (!url.startsWith("https://horizon.stellar.org/")) {
      throw new Error("Invalid Stellar API URL")
    }

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  return {
    trades: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `https://horizon.stellar.org/accounts/${publicKey}/trades?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },

    payments: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `https://horizon.stellar.org/accounts/${publicKey}/payments?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },

    operations: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `https://horizon.stellar.org/accounts/${publicKey}/operations?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },

    account: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `https://horizon.stellar.org/accounts/${publicKey}?_t=${timestamp}`
      return await makeRequest(url)
    },

    // New method to get effects which might show more transaction details
    effects: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format")
      }
      const timestamp = Date.now()
      const url = `https://horizon.stellar.org/accounts/${publicKey}/effects?limit=200&order=desc&_t=${timestamp}`
      const data = await makeRequest(url)
      return data._embedded?.records || []
    },
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    let walletAddress: string

    if (body) {
      try {
        const parsed = JSON.parse(body)
        walletAddress = parsed.walletAddress
      } catch {
        walletAddress = body.trim()
      }
    } else {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (!walletAddress || !validateStellarAddress(walletAddress)) {
      return NextResponse.json({ error: "Valid wallet address is required" }, { status: 400 })
    }

    console.log(`🔍 Debugging trades and payments for wallet: ${walletAddress}`)

    const server = getStellarServer()

    // First, check if the account exists and get basic info
    let accountInfo
    try {
      accountInfo = await server.account(walletAddress)
      console.log(`✅ Account found: ${walletAddress}`)
      console.log(`   Account has ${accountInfo.balances?.length || 0} balances`)
    } catch (error) {
      console.log(`❌ Account not found or error: ${error}`)
      return NextResponse.json({
        success: false,
        error: `Account not found or inaccessible: ${walletAddress}`,
      })
    }

    // Get all data sources in parallel
    const [trades, payments, operations, effects] = await Promise.all([
      server.trades(walletAddress).catch((e) => {
        console.log(`Trades fetch error: ${e.message}`)
        return []
      }),
      server.payments(walletAddress).catch((e) => {
        console.log(`Payments fetch error: ${e.message}`)
        return []
      }),
      server.operations(walletAddress).catch((e) => {
        console.log(`Operations fetch error: ${e.message}`)
        return []
      }),
      server.effects(walletAddress).catch((e) => {
        console.log(`Effects fetch error: ${e.message}`)
        return []
      }),
    ])

    console.log(`📊 Data fetched:`)
    console.log(`   - ${trades.length} trades`)
    console.log(`   - ${payments.length} payments`)
    console.log(`   - ${operations.length} operations`)
    console.log(`   - ${effects.length} effects`)

    const debugInfo = {
      walletAddress,
      accountExists: true,
      accountBalances: accountInfo.balances || [],
      totalTrades: trades.length,
      totalPayments: payments.length,
      totalOperations: operations.length,
      totalEffects: effects.length,
      hollowvoxTrades: [],
      totalHollowvoxSold: 0,
      totalXlmReceived: 0,
      skippedTrades: [],
      issuersFound: new Set(),
      hollowvoxPayments: [],
      hollowvoxOperations: [],
      hollowvoxEffects: [],
      paymentSales: [], // New: track sales found in payments
    }

    // Process trades first
    console.log(`🔄 Processing ${trades.length} trades...`)
    trades.forEach((trade: any, index: number) => {
      const tradeInfo = {
        index: index + 1,
        id: trade.id,
        date: trade.ledger_close_time,
        baseAccount: trade.base_account,
        counterAccount: trade.counter_account,
        baseAsset: `${trade.base_asset_code || "XLM"}${trade.base_asset_issuer ? `-${trade.base_asset_issuer.slice(-4)}` : ""}`,
        counterAsset: `${trade.counter_asset_code || "XLM"}${trade.counter_asset_issuer ? `-${trade.counter_asset_issuer.slice(-4)}` : ""}`,
        baseAmount: trade.base_amount,
        counterAmount: trade.counter_amount,
        baseIsSeller: trade.base_is_seller,
        walletRole: trade.base_account === walletAddress ? "base" : "counter",
        price: trade.price ? trade.price.n / trade.price.d : 0,
      }

      // Track all issuers we see
      if (trade.base_asset_issuer) {
        debugInfo.issuersFound.add(trade.base_asset_issuer)
      }
      if (trade.counter_asset_issuer) {
        debugInfo.issuersFound.add(trade.counter_asset_issuer)
      }

      // Check if wallet is involved (should always be true for /trades endpoint)
      const isWalletInvolved = trade.base_account === walletAddress || trade.counter_account === walletAddress

      if (!isWalletInvolved) {
        debugInfo.skippedTrades.push({ ...tradeInfo, reason: "Wallet not involved (unexpected)" })
        return
      }

      // Check if HOLLOWVOX is involved - expanded check
      const isHollowvoxInvolved =
        (trade.base_asset_code === HOLLOWVOX_ASSET_CODE && HOLLOWVOX_ISSUERS.includes(trade.base_asset_issuer)) ||
        (trade.counter_asset_code === HOLLOWVOX_ASSET_CODE && HOLLOWVOX_ISSUERS.includes(trade.counter_asset_issuer))

      if (!isHollowvoxInvolved) {
        debugInfo.skippedTrades.push({ ...tradeInfo, reason: "No HOLLOWVOX asset involved" })
        return
      }

      // Analyze the trade for HOLLOWVOX sales
      let hollowvoxAmount = 0
      let xlmAmount = 0
      let isSelling = false
      let issuer = ""
      let analysis = ""

      // Case 1: Wallet is selling HOLLOWVOX as base asset
      if (
        trade.base_account === walletAddress &&
        trade.base_asset_code === HOLLOWVOX_ASSET_CODE &&
        HOLLOWVOX_ISSUERS.includes(trade.base_asset_issuer) &&
        trade.base_is_seller === true
      ) {
        hollowvoxAmount = validateNumericValue(trade.base_amount)
        xlmAmount = validateNumericValue(trade.counter_amount)
        isSelling = true
        issuer = trade.base_asset_issuer
        analysis = "Wallet SELLING HOLLOWVOX (base asset) for XLM - PROFIT TRANSACTION"
      }
      // Case 2: Wallet is selling HOLLOWVOX as counter asset
      else if (
        trade.counter_account === walletAddress &&
        trade.counter_asset_code === HOLLOWVOX_ASSET_CODE &&
        HOLLOWVOX_ISSUERS.includes(trade.counter_asset_issuer) &&
        trade.base_is_seller === false
      ) {
        hollowvoxAmount = validateNumericValue(trade.counter_amount)
        xlmAmount = validateNumericValue(trade.base_amount)
        isSelling = true
        issuer = trade.counter_asset_issuer
        analysis = "Wallet SELLING HOLLOWVOX (counter asset) for XLM - PROFIT TRANSACTION"
      }
      // Case 3: Wallet is buying HOLLOWVOX with base XLM
      else if (
        trade.base_account === walletAddress &&
        trade.counter_asset_code === HOLLOWVOX_ASSET_CODE &&
        HOLLOWVOX_ISSUERS.includes(trade.counter_asset_issuer) &&
        trade.base_is_seller === true
      ) {
        hollowvoxAmount = validateNumericValue(trade.counter_amount)
        xlmAmount = validateNumericValue(trade.base_amount)
        isSelling = false
        issuer = trade.counter_asset_issuer
        analysis = "Wallet BUYING HOLLOWVOX with XLM - NOT PROFIT (purchase)"
      }
      // Case 4: Wallet is buying HOLLOWVOX with counter XLM
      else if (
        trade.counter_account === walletAddress &&
        trade.base_asset_code === HOLLOWVOX_ASSET_CODE &&
        HOLLOWVOX_ISSUERS.includes(trade.base_asset_issuer) &&
        trade.base_is_seller === true
      ) {
        hollowvoxAmount = validateNumericValue(trade.base_amount)
        xlmAmount = validateNumericValue(trade.counter_amount)
        isSelling = false
        issuer = trade.base_asset_issuer
        analysis = "Wallet BUYING HOLLOWVOX with XLM - NOT PROFIT (purchase)"
      } else {
        analysis = `Complex trade scenario - Base seller: ${trade.base_is_seller}, Wallet role: ${tradeInfo.walletRole}`
        isSelling = false
      }

      const tradeDetail = {
        ...tradeInfo,
        analysis,
        isSelling,
        hollowvoxAmount,
        xlmAmount,
        issuer: issuer.slice(-4),
        calculatedPrice: hollowvoxAmount > 0 ? xlmAmount / hollowvoxAmount : 0,
      }

      // Only count as profit if it's actually a sale
      if (isSelling && hollowvoxAmount > 0 && xlmAmount > 0) {
        debugInfo.totalHollowvoxSold += hollowvoxAmount
        debugInfo.totalXlmReceived += xlmAmount
        debugInfo.hollowvoxTrades.push(tradeDetail)
      } else {
        debugInfo.skippedTrades.push({
          ...tradeDetail,
          reason: isSelling ? "Invalid amounts" : analysis,
        })
      }
    })

    // Process payments - look for HOLLOWVOX transfers that might indicate sales
    console.log(`🔄 Processing ${payments.length} payments...`)
    payments.forEach((payment: any) => {
      // Track HOLLOWVOX payments
      if (
        payment.asset_code === HOLLOWVOX_ASSET_CODE &&
        HOLLOWVOX_ISSUERS.includes(payment.asset_issuer) &&
        (payment.from === walletAddress || payment.to === walletAddress)
      ) {
        const paymentDetail = {
          id: payment.id,
          date: payment.created_at,
          from: payment.from,
          to: payment.to,
          amount: payment.amount,
          asset: `${payment.asset_code}-${payment.asset_issuer.slice(-4)}`,
          type: payment.from === walletAddress ? "sent" : "received",
          transactionHash: payment.transaction_hash,
        }

        debugInfo.hollowvoxPayments.push(paymentDetail)

        // If wallet is sending HOLLOWVOX, this might be a sale
        if (payment.from === walletAddress) {
          debugInfo.paymentSales.push({
            ...paymentDetail,
            analysis: "HOLLOWVOX sent - potential sale (need to check corresponding XLM receipt)",
            hollowvoxAmount: validateNumericValue(payment.amount),
          })
        }
      }

      // Also track XLM payments that might be related to HOLLOWVOX sales
      if (
        !payment.asset_code && // XLM payments don't have asset_code
        payment.to === walletAddress && // Wallet receiving XLM
        validateNumericValue(payment.amount) > 0
      ) {
        // This could be XLM received from a HOLLOWVOX sale
        // We'd need to correlate with HOLLOWVOX payments by transaction hash or timing
      }
    })

    // Process operations for more detailed transaction analysis
    console.log(`🔄 Processing ${operations.length} operations...`)
    operations.forEach((operation: any) => {
      if (
        (operation.asset_code === HOLLOWVOX_ASSET_CODE && HOLLOWVOX_ISSUERS.includes(operation.asset_issuer)) ||
        (operation.selling_asset_code === HOLLOWVOX_ASSET_CODE &&
          HOLLOWVOX_ISSUERS.includes(operation.selling_asset_issuer)) ||
        (operation.buying_asset_code === HOLLOWVOX_ASSET_CODE &&
          HOLLOWVOX_ISSUERS.includes(operation.buying_asset_issuer))
      ) {
        debugInfo.hollowvoxOperations.push({
          id: operation.id,
          date: operation.created_at,
          type: operation.type,
          transactionHash: operation.transaction_hash,
          details: {
            asset_code: operation.asset_code,
            asset_issuer: operation.asset_issuer?.slice(-4),
            amount: operation.amount,
            selling_asset_code: operation.selling_asset_code,
            selling_asset_issuer: operation.selling_asset_issuer?.slice(-4),
            buying_asset_code: operation.buying_asset_code,
            buying_asset_issuer: operation.buying_asset_issuer?.slice(-4),
            from: operation.from,
            to: operation.to,
            offer_id: operation.offer_id,
          },
        })
      }
    })

    // Process effects for additional insights
    console.log(`🔄 Processing ${effects.length} effects...`)
    effects.forEach((effect: any) => {
      // Look for trade effects involving HOLLOWVOX
      if (
        (effect.type === "trade" || effect.type === "account_credited" || effect.type === "account_debited") &&
        ((effect.asset_code === HOLLOWVOX_ASSET_CODE && HOLLOWVOX_ISSUERS.includes(effect.asset_issuer)) ||
          (effect.bought_asset_code === HOLLOWVOX_ASSET_CODE &&
            HOLLOWVOX_ISSUERS.includes(effect.bought_asset_issuer)) ||
          (effect.sold_asset_code === HOLLOWVOX_ASSET_CODE && HOLLOWVOX_ISSUERS.includes(effect.sold_asset_issuer)))
      ) {
        debugInfo.hollowvoxEffects.push({
          id: effect.id,
          date: effect.created_at,
          type: effect.type,
          account: effect.account,
          details: {
            asset_code: effect.asset_code,
            asset_issuer: effect.asset_issuer?.slice(-4),
            amount: effect.amount,
            bought_asset_code: effect.bought_asset_code,
            bought_asset_issuer: effect.bought_asset_issuer?.slice(-4),
            bought_amount: effect.bought_amount,
            sold_asset_code: effect.sold_asset_code,
            sold_asset_issuer: effect.sold_asset_issuer?.slice(-4),
            sold_amount: effect.sold_amount,
          },
        })
      }
    })

    // Convert Set to Array for JSON serialization
    const debugResult = {
      ...debugInfo,
      issuersFound: Array.from(debugInfo.issuersFound),
      hollowvoxTradesCount: debugInfo.hollowvoxTrades.length,
      skippedTradesCount: debugInfo.skippedTrades.length,
      hollowvoxPaymentsCount: debugInfo.hollowvoxPayments.length,
      hollowvoxOperationsCount: debugInfo.hollowvoxOperations.length,
      hollowvoxEffectsCount: debugInfo.hollowvoxEffects.length,
      paymentSalesCount: debugInfo.paymentSales.length,
      averagePrice: debugInfo.totalHollowvoxSold > 0 ? debugInfo.totalXlmReceived / debugInfo.totalHollowvoxSold : 0,
      estimatedProfit: debugInfo.totalXlmReceived,
      actionFund: debugInfo.totalXlmReceived * 0.1,
      impactFund: debugInfo.totalXlmReceived * 0.1,
    }

    console.log(`✅ Debug complete for ${walletAddress}:`)
    console.log(`   - ${debugResult.totalTrades} total trades`)
    console.log(`   - ${debugResult.hollowvoxTradesCount} HOLLOWVOX sales from trades`)
    console.log(`   - ${debugResult.hollowvoxPaymentsCount} HOLLOWVOX payments`)
    console.log(`   - ${debugResult.paymentSalesCount} potential sales from payments`)
    console.log(`   - ${debugResult.hollowvoxOperationsCount} HOLLOWVOX operations`)
    console.log(`   - ${debugResult.hollowvoxEffectsCount} HOLLOWVOX effects`)
    console.log(`   - ${debugResult.estimatedProfit.toFixed(2)} XLM profit`)

    return NextResponse.json({
      success: true,
      debug: debugResult,
    })
  } catch (error) {
    console.error("❌ Error in debug route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Debug failed",
      },
      { status: 500 },
    )
  }
}
