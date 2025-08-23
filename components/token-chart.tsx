"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, TrendingDown, ExternalLink } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StellarExpertWidget } from "./stellar-expert-widget"

// HOLLOWVOX token issuers
const HVX_ISSUERS = [
  {
    address: "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    name: "HVX-1",
    color: "#00ff76",
    stellarExpertUrl:
      "https://stellar.expert/explorer/public/asset/HOLLOWVOX-GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    bandcoinUrl: "https://www.bandcoin.io/fans/creator/GDHJSO4ZGWQRKCUEAMRG3B2D7DAJCM3WCL32KBTRG2J7S7UM6WPRBYOY",
  },
  {
    address: "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
    name: "HVX-2",
    color: "#ff6b00",
    stellarExpertUrl:
      "https://stellar.expert/explorer/public/asset/HOLLOWVOX-GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
    lumemeUrl: "https://lu.meme/explore/memes/HOLLOWVOX-GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
  },
]

interface TokenStats {
  price: number
  volume24h: number
  change24h: number
  marketCap: number
  supply: number
  lastUpdated: string
}

interface HistoricalDataPoint {
  timestamp: string
  date: string
  hvx1_price: number | null
  hvx2_price: number | null
  hvx1_volume: number
  hvx2_volume: number
}

const chartConfig = {
  hvx1_price: {
    label: "HVX-1 Price",
    color: "#00ff76",
  },
  hvx2_price: {
    label: "HVX-2 Price",
    color: "#ff6b00",
  },
}

export function TokenChart() {
  const [tokenStats, setTokenStats] = useState<{ [key: string]: TokenStats }>({})
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch data for both HOLLOWVOX tokens from Stellar
        const promises = HVX_ISSUERS.map(async (issuer) => {
          try {
            // Get asset info from Horizon
            const assetResponse = await fetch(
              `https://horizon.stellar.org/assets?asset_code=HOLLOWVOX&asset_issuer=${issuer.address}`,
            )

            if (!assetResponse.ok) {
              throw new Error(`Failed to fetch data for ${issuer.name}`)
            }

            const assetData = await assetResponse.json()

            // Get more historical trades for charting (last 1000 trades)
            const tradesResponse = await fetch(
              `https://horizon.stellar.org/trades?base_asset_type=credit_alphanum12&base_asset_code=HOLLOWVOX&base_asset_issuer=${issuer.address}&counter_asset_type=native&limit=1000&order=desc`,
            )

            let trades = []
            if (tradesResponse.ok) {
              const tradesData = await tradesResponse.json()
              trades = tradesData._embedded?.records || []
            }

            return {
              issuer: issuer.address,
              name: issuer.name,
              color: issuer.color,
              asset: assetData._embedded?.records?.[0] || null,
              trades,
            }
          } catch (err) {
            console.error(`Error fetching data for ${issuer.name}:`, err)
            return {
              issuer: issuer.address,
              name: issuer.name,
              color: issuer.color,
              asset: null,
              trades: [],
              error: err instanceof Error ? err.message : "Unknown error",
            }
          }
        })

        const results = await Promise.all(promises)

        // Process current stats
        const processedStats: { [key: string]: TokenStats } = {}

        results.forEach((result) => {
          const { name, asset, trades } = result

          let price = 0
          let volume24h = 0
          let change24h = 0

          if (trades.length > 0) {
            const latestTrade = trades[0]
            price = Number.parseFloat(latestTrade.price?.n || "0") / Number.parseFloat(latestTrade.price?.d || "1")

            const now = new Date()
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

            volume24h = trades
              .filter((trade) => new Date(trade.ledger_close_time) > yesterday)
              .reduce((sum, trade) => {
                const tradeAmount = Number.parseFloat(trade.base_amount || "0")
                return sum + tradeAmount
              }, 0)

            const yesterdayTrades = trades.filter((trade) => new Date(trade.ledger_close_time) <= yesterday)
            if (yesterdayTrades.length > 0) {
              const yesterdayPrice =
                Number.parseFloat(yesterdayTrades[0].price?.n || "0") /
                Number.parseFloat(yesterdayTrades[0].price?.d || "1")
              change24h = yesterdayPrice > 0 ? ((price - yesterdayPrice) / yesterdayPrice) * 100 : 0
            }
          }

          processedStats[name] = {
            price,
            volume24h,
            change24h,
            marketCap: asset ? Number.parseFloat(asset.amount || "0") * price : 0,
            supply: asset ? Number.parseFloat(asset.amount || "0") : 0,
            lastUpdated: new Date().toLocaleString(),
          }
        })

        // Process historical data for charts
        const historicalMap = new Map<string, HistoricalDataPoint>()

        results.forEach((result) => {
          const { name, trades } = result

          trades.forEach((trade) => {
            const tradeDate = new Date(trade.ledger_close_time)
            const dateKey = tradeDate.toISOString().split("T")[0] // Group by day
            const price = Number.parseFloat(trade.price?.n || "0") / Number.parseFloat(trade.price?.d || "1")
            const volume = Number.parseFloat(trade.base_amount || "0")

            if (!historicalMap.has(dateKey)) {
              historicalMap.set(dateKey, {
                timestamp: tradeDate.toISOString(),
                date: tradeDate.toLocaleDateString(),
                hvx1_price: null,
                hvx2_price: null,
                hvx1_volume: 0,
                hvx2_volume: 0,
              })
            }

            const dataPoint = historicalMap.get(dateKey)!

            if (name === "HVX-1") {
              // Use the most recent price for this day, or update if this is more recent
              if (dataPoint.hvx1_price === null || new Date(trade.ledger_close_time) > new Date(dataPoint.timestamp)) {
                dataPoint.hvx1_price = price
              }
              dataPoint.hvx1_volume += volume
            } else if (name === "HVX-2") {
              if (dataPoint.hvx2_price === null || new Date(trade.ledger_close_time) > new Date(dataPoint.timestamp)) {
                dataPoint.hvx2_price = price
              }
              dataPoint.hvx2_volume += volume
            }
          })
        })

        // Convert to array and sort by date
        const historicalArray = Array.from(historicalMap.values())
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-30) // Show last 30 days

        setTokenStats(processedStats)
        setHistoricalData(historicalArray)
      } catch (err) {
        console.error("Error fetching token data:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch token data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokenData()

    // Refresh data every 5 minutes
    const interval = setInterval(fetchTokenData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron">HOLLOWVOX Token Performance</CardTitle>
            <CardDescription>Loading live data from Stellar network...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] sm:h-[400px] w-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Fetching real historical data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron">HOLLOWVOX Token Performance</CardTitle>
            <CardDescription>Error loading token data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] sm:h-[400px] w-full items-center justify-center">
              <div className="text-center">
                <p className="text-red-400 mb-2">Failed to load token data</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalMarketCap = Object.values(tokenStats).reduce((sum, stats) => sum + stats.marketCap, 0)
  const totalSupply = Object.values(tokenStats).reduce((sum, stats) => sum + stats.supply, 0)

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Combined Stats Overview */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-orbitron text-xl sm:text-2xl">HOLLOWVOX Live Performance</CardTitle>
              <CardDescription className="text-sm">
                Real-time data from Stellar network • Last updated: {Object.values(tokenStats)[0]?.lastUpdated}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-transparent text-xs sm:text-sm" asChild>
                <a
                  href="https://stellar.expert/explorer/public/search?term=HOLLOWVOX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline">All HOLLOWVOX Assets</span>
                  <span className="sm:hidden">All Assets</span>
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Market Cap</p>
              <p className="font-bold text-lg">${totalMarketCap.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Supply</p>
              <p className="font-bold text-lg">{totalSupply.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Active Issuers</p>
              <p className="font-bold text-lg">{HVX_ISSUERS.length}</p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Network</p>
              <p className="font-bold text-lg">Stellar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* StellarExpert Live Price Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {HVX_ISSUERS.map((issuer) => (
          <StellarExpertWidget
            key={issuer.address}
            assetCode="HOLLOWVOX"
            issuerAddress={issuer.address}
            issuerName={issuer.name}
            issuerColor={issuer.color}
            stellarExpertUrl={issuer.stellarExpertUrl}
          />
        ))}
      </div>

      {/* Historical Price Charts */}
      {historicalData.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl sm:text-2xl">Historical Price Data</CardTitle>
            <CardDescription className="text-sm">
              Real price history from Stellar trades • Last {historicalData.length} days with trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="price" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="price" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Price History</span>
                  <span className="sm:hidden">Price</span>
                </TabsTrigger>
                <TabsTrigger value="volume" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Volume History</span>
                  <span className="sm:hidden">Volume</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="price" className="mt-6">
                <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(value) => `$${value.toFixed(4)}`}
                        width={60}
                      />
                      <Tooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [
                              value ? `$${Number(value).toFixed(6)}` : "No trades",
                              name === "hvx1_price" ? "HVX-1 Price" : "HVX-2 Price",
                            ]}
                            labelClassName="font-bold text-xs"
                            className="bg-background/90 backdrop-blur-sm border-border text-xs"
                          />
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                      <Line
                        type="monotone"
                        dataKey="hvx1_price"
                        stroke={HVX_ISSUERS[0].color}
                        strokeWidth={2}
                        name="HVX-1"
                        dot={{ r: 2, fill: HVX_ISSUERS[0].color }}
                        activeDot={{ r: 4 }}
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="hvx2_price"
                        stroke={HVX_ISSUERS[1].color}
                        strokeWidth={2}
                        name="HVX-2"
                        dot={{ r: 2, fill: HVX_ISSUERS[1].color }}
                        activeDot={{ r: 4 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="volume" className="mt-6">
                <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickFormatter={(value) => value.toLocaleString()}
                        width={60}
                      />
                      <Tooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [
                              Number(value).toLocaleString(),
                              name === "hvx1_volume" ? "HVX-1 Volume" : "HVX-2 Volume",
                            ]}
                            labelClassName="font-bold text-xs"
                            className="bg-background/90 backdrop-blur-sm border-border text-xs"
                          />
                        }
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                      <Line
                        type="monotone"
                        dataKey="hvx1_volume"
                        stroke={HVX_ISSUERS[0].color}
                        strokeWidth={2}
                        name="HVX-1 Volume"
                        dot={{ r: 2, fill: HVX_ISSUERS[0].color }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hvx2_volume"
                        stroke={HVX_ISSUERS[1].color}
                        strokeWidth={2}
                        name="HVX-2 Volume"
                        dot={{ r: 2, fill: HVX_ISSUERS[1].color }}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Individual Token Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {HVX_ISSUERS.map((issuer) => {
          const stats = tokenStats[issuer.name]
          if (!stats) return null

          return (
            <Card key={issuer.address} className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <CardTitle className="font-orbitron text-lg">{issuer.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" style={{ borderColor: issuer.color, color: issuer.color }}>
                      HOLLOWVOX
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <a
                        href={issuer.stellarExpertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on StellarExpert"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <CardDescription className="font-mono text-xs break-all sm:break-normal">
                  <span className="sm:hidden">{issuer.address}</span>
                  <span className="hidden sm:inline">
                    {issuer.address.slice(0, 8)}...{issuer.address.slice(-8)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                    <p className="font-bold text-lg">${stats.price.toFixed(6)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">24h Change</p>
                    <div className="flex items-center justify-center gap-1">
                      {stats.change24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`font-bold ${stats.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {stats.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">24h Volume</span>
                    <span className="font-mono text-sm font-semibold">{stats.volume24h.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Supply</span>
                    <span className="font-mono text-sm font-semibold">{stats.supply.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Market Cap</span>
                  <span className="font-bold text-lg">${stats.marketCap.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                      <a
                        href={issuer.stellarExpertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">StellarExpert</span>
                        <span className="sm:hidden">Expert</span>
                      </a>
                    </Button>
                    {issuer.lumemeUrl && (
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                        <a
                          href={issuer.lumemeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="hidden sm:inline">lu.meme</span>
                          <span className="sm:hidden">Meme</span>
                        </a>
                      </Button>
                    )}
                    {issuer.bandcoinUrl && (
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
                        <a
                          href={issuer.bandcoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="hidden sm:inline">Bandcoin</span>
                          <span className="sm:hidden">Band</span>
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
