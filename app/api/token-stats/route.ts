import { NextResponse } from "next/server";

// HOLLOWVOX token issuers
const HOLLOWVOX_ISSUERS = [
  {
    address: "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    name: "HOLLOWVOX-1",
    color: "#00ff76",
  },
  {
    address: "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
    name: "HOLLOWVOX-2",
    color: "#ff6b00",
  },
];

interface TokenStats {
  price: number;
  volume24h: number;
  change24h: number;
  marketCap: number;
  supply: number;
  lastUpdated: string;
  trades: number;
}

async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "HollowvoxApp/1.0",
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function GET() {
  try {
    const tokenStats: { [key: string]: TokenStats } = {};

    for (const issuer of HOLLOWVOX_ISSUERS) {
      try {
        console.log(`Fetching data for ${issuer.name}...`);

        // Get asset details from Horizon API
        const assetUrl = `https://horizon.stellar.org/assets?asset_code=HOLLOWVOX&asset_issuer=${issuer.address}&limit=1`;
        const assetResponse = await fetchWithTimeout(assetUrl);

        if (!assetResponse.ok) {
          throw new Error(`Asset API returned ${assetResponse.status}`);
        }

        const assetData = await assetResponse.json();

        // Get recent trades
        const tradesUrl = `https://horizon.stellar.org/trades?base_asset_type=credit_alphanum12&base_asset_code=HOLLOWVOX&base_asset_issuer=${issuer.address}&counter_asset_type=native&order=desc&limit=200`;
        const tradesResponse = await fetchWithTimeout(tradesUrl);

        let trades = [];
        let currentPrice = 0;
        let volume24h = 0;
        let change24h = 0;
        let tradesCount = 0;

        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          trades = tradesData._embedded?.records || [];

          // Calculate current price from latest trade
          if (trades.length > 0) {
            const latestTrade = trades[0];
            if (
              latestTrade.price &&
              latestTrade.price.n &&
              latestTrade.price.d
            ) {
              currentPrice =
                Number.parseFloat(latestTrade.price.n) /
                Number.parseFloat(latestTrade.price.d);
            }
          }

          // Calculate 24h metrics
          const now = new Date();
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

          // Filter trades from last 24 hours
          const trades24h = trades.filter((trade: any) => {
            try {
              return new Date(trade.ledger_close_time) > yesterday;
            } catch {
              return false;
            }
          });

          tradesCount = trades24h.length;

          // Calculate 24h volume
          volume24h = trades24h.reduce((sum: number, trade: any) => {
            try {
              return sum + Number.parseFloat(trade.base_amount || "0");
            } catch {
              return sum;
            }
          }, 0);

          // Calculate 24h price change
          const tradesYesterday = trades.filter((trade: any) => {
            try {
              const tradeTime = new Date(trade.ledger_close_time);
              return tradeTime <= yesterday && tradeTime > twoDaysAgo;
            } catch {
              return false;
            }
          });

          if (tradesYesterday.length > 0 && currentPrice > 0) {
            try {
              const yesterdayTrade = tradesYesterday[0];
              if (
                yesterdayTrade.price &&
                yesterdayTrade.price.n &&
                yesterdayTrade.price.d
              ) {
                const yesterdayPrice =
                  Number.parseFloat(yesterdayTrade.price.n) /
                  Number.parseFloat(yesterdayTrade.price.d);
                if (yesterdayPrice > 0) {
                  change24h =
                    ((currentPrice - yesterdayPrice) / yesterdayPrice) * 100;
                }
              }
            } catch (error) {
              console.log(
                `Error calculating price change for ${issuer.name}:`,
                error
              );
            }
          }
        }

        // Get supply from asset details - try multiple approaches
        let supply = 0;

        // First try: from asset API response
        if (assetData._embedded?.records?.length > 0) {
          const assetRecord = assetData._embedded.records[0];
          // console.log(`Asset record for ${issuer.name}:`, assetRecord);

          // Try different possible field names for supply
          if (assetRecord.amount) {
            supply = Number.parseFloat(assetRecord.amount);
          } else if (assetRecord.num_accounts && assetRecord.balances) {
            // Sometimes supply is in balances
            supply = Number.parseFloat(assetRecord.balances || "0");
          }
        }

        // Second try: Get supply from issuer account if asset API doesn't have it
        if (supply === 0) {
          try {
            const issuerUrl = `https://horizon.stellar.org/accounts/${issuer.address}`;
            const issuerResponse = await fetchWithTimeout(issuerUrl);

            if (issuerResponse.ok) {
              const issuerData = await issuerResponse.json();
              // console.log(`Issuer data for ${issuer.name}:`, issuerData);

              // Look for the token in the issuer's balances
              if (issuerData.balances) {
                for (const balance of issuerData.balances) {
                  if (
                    balance.asset_code === "HOLLOWVOX" &&
                    balance.asset_issuer === issuer.address
                  ) {
                    // For issued tokens, the supply is usually the total minus what the issuer holds
                    const issuerBalance = Number.parseFloat(
                      balance.balance || "0"
                    );
                    // This might not be the total supply, but it's better than 0
                    supply = issuerBalance;
                    break;
                  }
                }
              }
            }
          } catch (error) {
            console.log(
              `Error fetching issuer data for ${issuer.name}:`,
              error
            );
          }
        }

        // Third try: Calculate supply from all holders (more expensive but accurate)
        if (supply === 0) {
          try {
            const holdersUrl = `https://horizon.stellar.org/accounts?asset=HOLLOWVOX:${issuer.address}&limit=200`;
            const holdersResponse = await fetchWithTimeout(holdersUrl);

            if (holdersResponse.ok) {
              const holdersData = await holdersResponse.json();
              // console.log(`Holders data for ${issuer.name}:`, holdersData)

              if (holdersData._embedded?.records) {
                supply = holdersData._embedded.records.reduce(
                  (total: number, account: any) => {
                    if (account.balances) {
                      for (const balance of account.balances) {
                        if (
                          balance.asset_code === "HOLLOWVOX" &&
                          balance.asset_issuer === issuer.address
                        ) {
                          return (
                            total + Number.parseFloat(balance.balance || "0")
                          );
                        }
                      }
                    }
                    return total;
                  },
                  0
                );
              }
            }
          } catch (error) {
            console.log(
              `Error fetching holders data for ${issuer.name}:`,
              error
            );
          }
        }

        // Calculate market cap
        const marketCap = supply * currentPrice;

        tokenStats[issuer.name] = {
          price: currentPrice,
          volume24h,
          change24h,
          marketCap,
          supply,
          trades: tradesCount,
          lastUpdated: new Date().toISOString(),
        };

        console.log(`Successfully fetched data for ${issuer.name}:`, {
          price: currentPrice,
          volume24h,
          supply,
          marketCap,
          trades: tradesCount,
        });
      } catch (error) {
        console.error(`Error fetching data for ${issuer.name}:`, error);

        // Return default values on error
        tokenStats[issuer.name] = {
          price: 0,
          volume24h: 0,
          change24h: 0,
          marketCap: 0,
          supply: 0,
          trades: 0,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: tokenStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in token stats API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch token statistics",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
