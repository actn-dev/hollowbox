import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

interface TradeData {
  totalProfit: number;
  actionFund: number;
  impactFund: number;
  liquidityProvided: number;
  totalTrades: number;
  recentTransactions: Array<{
    hash: string;
    type: string;
    amount: string;
    asset: string;
    timestamp: string;
    profit?: number;
  }>;
  // Add fields corresponding to snapshot table
  totalHollowvoxSold?: number;
  totalXlmReceived?: number;
  averageSellPrice?: number;
  lastTransactionDate?: string;
}

const stellarServerUrl = "https://horizon.stellar.org/";
const sqlClient = neon(process.env.DATABASE_URL!);

// Configuration with validation
const HOLLOWVOX_ASSET_CODE = "HOLLOWVOX";
const HOLLOWVOX_ISSUER =
  "GAMPLEHPKGQVURMWCZUKGTJKIBEYBDQZQHLY4VEG2JQNVTQR7WJRKGXGR";

// Rate limiting to prevent spam
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10;

  const current = rateLimitMap.get(ip);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

interface StellarTransaction {
  id: string;
  hash: string;
  created_at: string;
  successful: boolean;
  operation_count: number;
  operations?: Array<{
    type: string;
    type_i: number;
    asset_code?: string;
    asset_issuer?: string;
    amount?: string;
    from?: string;
    to?: string;
    buying_asset_code?: string;
    buying_asset_issuer?: string;
    selling_asset_code?: string;
    selling_asset_issuer?: string;
  }>;
}

interface TradeData {
  totalProfit: number;
  actionFund: number;
  impactFund: number;
  liquidityProvided: number;
  totalTrades: number;
  recentTransactions: Array<{
    hash: string;
    type: string;
    amount: string;
    asset: string;
    timestamp: string;
    profit?: number;
  }>;
}

const getStellarServer = () => {
  const makeRequest = async (url: string): Promise<any> => {
    // Validate URL to prevent SSRF attacks
    if (!url.startsWith(stellarServerUrl)) {
      throw new Error("Invalid Stellar API URL");
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
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  };

  return {
    loadAccount: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format");
      }
      const timestamp = Date.now();
      const url = `${stellarServerUrl}accounts/${publicKey}?_t=${timestamp}`;
      return await makeRequest(url);
    },

    trades: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format");
      }
      const timestamp = Date.now();
      const url = `${stellarServerUrl}accounts/${publicKey}/trades?limit=200&order=desc&_t=${timestamp}`;
      const data = await makeRequest(url);
      return data._embedded?.records || [];
    },

    payments: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format");
      }
      const timestamp = Date.now();
      const url = `${stellarServerUrl}accounts/${publicKey}/payments?limit=200&order=desc&_t=${timestamp}`;
      const data = await makeRequest(url);
      return data._embedded?.records || [];
    },

    operations: async (publicKey: string) => {
      if (!validateStellarAddress(publicKey)) {
        throw new Error("Invalid Stellar address format");
      }
      const timestamp = Date.now();
      const url = `${stellarServerUrl}accounts/${publicKey}/operations?limit=200&order=desc&_t=${timestamp}`;
      const data = await makeRequest(url);
      return data._embedded?.records || [];
    },
  };
};

const validateStellarAddress = (address: string): boolean => {
  return typeof address === "string" && /^G[A-Z2-7]{55}$/.test(address);
};

const validateNumericValue = (value: any): number => {
  const num = Number(value);
  return isNaN(num) || num < 0 ? 0 : num;
};

const sanitizeString = (str: any): string => {
  if (typeof str !== "string") return "";
  return str.slice(0, 1000); // Limit string length
};

// Extracted wallet data processing logic into a reusable function
async function processWalletData(walletAddress: string): Promise<TradeData> {
  if (!validateStellarAddress(walletAddress)) {
    throw new Error("Invalid Stellar address format");
  }

  console.log(`Updating profit data for wallet: ${walletAddress}`);

  // Fetch transactions from Stellar
  const transactionsUrl = `${stellarServerUrl}accounts/${walletAddress}/transactions?limit=200&order=desc`;
  const transactionsResponse = await fetch(transactionsUrl);

  if (!transactionsResponse.ok) {
    throw new Error(
      `Failed to fetch transactions: ${transactionsResponse.statusText}`
    );
  }

  const transactionsData = await transactionsResponse.json();
  const transactions: StellarTransaction[] =
    transactionsData._embedded?.records || [];

  console.log(`Found ${transactions.length} transactions`);

  let totalProfit = 0;
  let actionFund = 0;
  let impactFund = 0;
  let liquidityProvided = 0;
  let totalTrades = 0;
  const recentTransactions: TradeData["recentTransactions"] = [];

  // Process each transaction
  for (const transaction of transactions) {
    if (!transaction.successful) continue;

    try {
      // Fetch operations for this transaction
      const operationsUrl = `${stellarServerUrl}transactions/${transaction.hash}/operations`;
      const operationsResponse = await fetch(operationsUrl);

      if (!operationsResponse.ok) continue;

      const operationsData = await operationsResponse.json();
      const operations = operationsData._embedded?.records || [];

      // Process operations
      for (const operation of operations) {
        if (
          operation.type === "path_payment_strict_send" ||
          operation.type === "path_payment_strict_receive"
        ) {
          // Check if this involves HOLLOWVOX
          const isHollowvoxSale =
            (operation.selling_asset_code === HOLLOWVOX_ASSET_CODE &&
              operation.selling_asset_issuer === HOLLOWVOX_ISSUER) ||
            (operation.asset_code === HOLLOWVOX_ASSET_CODE &&
              operation.asset_issuer === HOLLOWVOX_ISSUER);

          if (isHollowvoxSale && operation.amount) {
            const amount = Number.parseFloat(operation.amount);
            totalProfit += amount;
            totalTrades++;

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
              });
            }
          }
        } else if (
          operation.type === "manage_sell_offer" ||
          operation.type === "manage_buy_offer"
        ) {
          // Check for HOLLOWVOX trading offers
          const isHollowvoxOffer =
            (operation.selling_asset_code === HOLLOWVOX_ASSET_CODE &&
              operation.selling_asset_issuer === HOLLOWVOX_ISSUER) ||
            (operation.buying_asset_code === HOLLOWVOX_ASSET_CODE &&
              operation.buying_asset_issuer === HOLLOWVOX_ISSUER);

          if (isHollowvoxOffer) {
            totalTrades++;

            if (recentTransactions.length < 50) {
              recentTransactions.push({
                hash: transaction.hash,
                type: "HOLLOWVOX Trade",
                amount: operation.amount || "0",
                asset: "HOLLOWVOX",
                timestamp: transaction.created_at,
              });
            }
          }
        } else if (operation.type === "change_trust") {
          // Track liquidity provision
          if (
            operation.asset_code === HOLLOWVOX_ASSET_CODE &&
            operation.asset_issuer === HOLLOWVOX_ISSUER
          ) {
            const limit = Number.parseFloat(operation.limit || "0");
            liquidityProvided += limit;
          }
        }
      }
    } catch (operationError) {
      console.error(
        `Error processing operations for transaction ${transaction.hash}:`,
        operationError
      );
      continue;
    }
  }

  // Calculate additional metrics
  actionFund = totalProfit * 0.2;
  impactFund = totalProfit * 0.2;

  // Calculate HOLLOWVOX specific metrics
  let totalHollowvoxSold = 0;
  let totalXlmReceived = 0;

  // Process transactions to calculate additional metrics
  recentTransactions.forEach((tx) => {
    if (tx.type === "HOLLOWVOX Sale" || tx.type.includes("HOLLOWVOX")) {
      if (tx.asset === "HOLLOWVOX") {
        totalHollowvoxSold += parseFloat(tx.amount);
      } else if (tx.asset === "XLM" && tx.profit) {
        totalXlmReceived += tx.profit;
      }
    }
  });

  // Calculate average sell price if applicable
  const averageSellPrice =
    totalHollowvoxSold > 0 ? totalXlmReceived / totalHollowvoxSold : 0;

  // Get last transaction date
  const lastTransactionDate =
    recentTransactions.length > 0
      ? recentTransactions[0].timestamp
      : new Date().toISOString();

  const tradeData: TradeData = {
    totalProfit,
    actionFund,
    impactFund,
    liquidityProvided,
    totalTrades,
    recentTransactions,
    // Add snapshot fields
    totalHollowvoxSold,
    totalXlmReceived,
    averageSellPrice,
    lastTransactionDate,
  };

  console.log(`Processed data for ${walletAddress}:`, {
    totalProfit,
    actionFund,
    impactFund,
    liquidityProvided,
    totalTrades,
    transactionCount: recentTransactions.length,
  });

  return tradeData;
}

export async function POST(request: Request) {
  try {
    // Validate environment
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not configured");
    }

    // Handle request body parsing more safely
    let requestBody = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.log(
        "No request body or invalid JSON, proceeding with default behavior"
      );
    }

    // Rate limiting
    const clientIP = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          error: "Update rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    console.log("🔄 Starting profit tracker data update...");

    // Access walletAddress safely with type checking
    const walletAddress =
      typeof requestBody === "object" && requestBody !== null
        ? (requestBody as any).walletAddress
        : undefined;

    // If no wallet address is provided, fetch all wallet addresses from database
    if (!walletAddress) {
      console.log("No wallet address provided, updating all tracked wallets");

      const wallets = await sqlClient`
        SELECT address FROM profit_tracker_wallets
        ORDER BY id
        LIMIT 10
      `;

      if (wallets && wallets.length > 0) {
        // Process each wallet sequentially
        const results = [];
        for (const wallet of wallets) {
          try {
            console.log(`Processing wallet: ${wallet.address}`);

            // Process this wallet
            const tradeData = await processWalletData(wallet.address);

            // Update profit_tracker_snapshots with aggregated metrics
            await sqlClient`
              INSERT INTO profit_tracker_snapshots (
                wallet_address, 
                estimated_profit, 
                action_fund_allocation, 
                impact_fund_allocation,
                total_liquidity_provided,
                transaction_count,
                last_transaction_date,
                total_hollowvox_sold,
                total_xlm_received,
                average_sell_price
              )
              VALUES (
                ${wallet.address}, 
                ${tradeData.totalProfit}, 
                ${tradeData.actionFund}, 
                ${tradeData.impactFund},
                ${tradeData.liquidityProvided},
                ${tradeData.totalTrades},
                ${tradeData.lastTransactionDate},
                ${tradeData.totalHollowvoxSold || 0},
                ${tradeData.totalXlmReceived || 0},
                ${tradeData.averageSellPrice || 0}
              )
              ON CONFLICT (wallet_address) 
              DO UPDATE SET 
                estimated_profit = ${tradeData.totalProfit},
                action_fund_allocation = ${tradeData.actionFund},
                impact_fund_allocation = ${tradeData.impactFund},
                total_liquidity_provided = ${tradeData.liquidityProvided},
                transaction_count = ${tradeData.totalTrades},
                last_transaction_date = ${tradeData.lastTransactionDate},
                total_hollowvox_sold = ${tradeData.totalHollowvoxSold || 0},
                total_xlm_received = ${tradeData.totalXlmReceived || 0},
                average_sell_price = ${tradeData.averageSellPrice || 0}
            `;

            // Insert recent transactions into profit_tracker_transactions
            for (const tx of tradeData.recentTransactions.slice(0, 20)) {
              // Limit to 20 most recent
              try {
                await sqlClient`
                  INSERT INTO profit_tracker_transactions (
                    id, 
                    wallet_address, 
                    transaction_date, 
                    transaction_type,
                    hollowvox_amount,
                    xlm_amount,
                    price
                  )
                  VALUES (
                    ${tx.hash}, 
                    ${wallet.address}, 
                    ${tx.timestamp ? new Date(tx.timestamp) : new Date()}, 
                    ${
                      tx.type === "HOLLOWVOX Sale"
                        ? "trade"
                        : tx.type === "HOLLOWVOX Trade"
                        ? "trade"
                        : "payment"
                    },
                    ${tx.asset === "HOLLOWVOX" ? parseFloat(tx.amount) : 0},
                    ${
                      tx.asset === "XLM"
                        ? parseFloat(tx.amount)
                        : tx.profit || 0
                    },
                    ${tx.profit ? tx.profit / parseFloat(tx.amount) : 0}
                  )
                  ON CONFLICT (id) DO NOTHING
                `;
              } catch (txError) {
                console.error(
                  `Error inserting transaction ${tx.hash}:`,
                  txError
                );
                // Continue with other transactions
              }
            }

            results.push({
              address: wallet.address,
              success: true,
              trades: tradeData.totalTrades,
            });
          } catch (walletError) {
            console.error(
              `Error processing wallet ${wallet.address}:`,
              walletError
            );
            results.push({
              address: wallet.address,
              success: false,
              error: "Failed to process wallet data",
            });
          }
        }

        return NextResponse.json({
          success: true,
          message: `Updated data for ${
            results.filter((r) => r.success).length
          }/${results.length} wallets`,
          results,
        });
      } else {
        return NextResponse.json(
          { success: false, error: "No wallets found in database" },
          { status: 400 }
        );
      }
    }

    // Process a single wallet
    try {
      // First check if wallet exists in profit_tracker_wallets
      const walletCheck = await sqlClient`
        SELECT address FROM profit_tracker_wallets WHERE address = ${walletAddress}
      `;

      if (!walletCheck || walletCheck.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Wallet address not found in tracked wallets. Please use a wallet from the list.",
          },
          { status: 400 }
        );
      }

      const tradeData = await processWalletData(walletAddress);

      // Update profit_tracker_snapshots with aggregated metrics
      await sqlClient`
        INSERT INTO profit_tracker_snapshots (
          wallet_address, 
          estimated_profit, 
          action_fund_allocation, 
          impact_fund_allocation,
          total_liquidity_provided,
          transaction_count,
          last_transaction_date,
          total_hollowvox_sold,
          total_xlm_received,
          average_sell_price
        )
        VALUES (
          ${walletAddress}, 
          ${tradeData.totalProfit}, 
          ${tradeData.actionFund}, 
          ${tradeData.impactFund},
          ${tradeData.liquidityProvided},
          ${tradeData.totalTrades},
          ${tradeData.lastTransactionDate},
          ${tradeData.totalHollowvoxSold || 0},
          ${tradeData.totalXlmReceived || 0},
          ${tradeData.averageSellPrice || 0}
        )
        ON CONFLICT (wallet_address) 
        DO UPDATE SET 
          estimated_profit = ${tradeData.totalProfit},
          action_fund_allocation = ${tradeData.actionFund},
          impact_fund_allocation = ${tradeData.impactFund},
          total_liquidity_provided = ${tradeData.liquidityProvided},
          transaction_count = ${tradeData.totalTrades},
          last_transaction_date = ${tradeData.lastTransactionDate},
          total_hollowvox_sold = ${tradeData.totalHollowvoxSold || 0},
          total_xlm_received = ${tradeData.totalXlmReceived || 0},
          average_sell_price = ${tradeData.averageSellPrice || 0}
      `;

      // Insert recent transactions into profit_tracker_transactions
      for (const tx of tradeData.recentTransactions.slice(0, 20)) {
        // Limit to 20 most recent
        try {
          await sqlClient`
            INSERT INTO profit_tracker_transactions (
              id, 
              wallet_address, 
              transaction_date, 
              transaction_type,
              hollowvox_amount,
              xlm_amount,
              price
            )
            VALUES (
              ${tx.hash}, 
              ${walletAddress}, 
              ${tx.timestamp ? new Date(tx.timestamp) : new Date()}, 
              ${
                tx.type === "HOLLOWVOX Sale"
                  ? "trade"
                  : tx.type === "HOLLOWVOX Trade"
                  ? "trade"
                  : "payment"
              },
              ${tx.asset === "HOLLOWVOX" ? parseFloat(tx.amount) : 0},
              ${tx.asset === "XLM" ? parseFloat(tx.amount) : tx.profit || 0},
              ${tx.profit ? tx.profit / parseFloat(tx.amount) : 0}
            )
            ON CONFLICT (id) DO NOTHING
          `;
        } catch (txError) {
          console.error(`Error inserting transaction ${tx.hash}:`, txError);
          // Continue with other transactions
        }
      }

      return NextResponse.json({
        success: true,
        data: tradeData,
        message: `Updated profit data: ${tradeData.totalTrades} trades processed`,
      });
    } catch (error) {
      console.error(`Error processing wallet ${walletAddress}:`, error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to process wallet data: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating profit tracker:", error);
    return NextResponse.json(
      { error: "Failed to update profit data" },
      { status: 500 }
    );
  }
}
