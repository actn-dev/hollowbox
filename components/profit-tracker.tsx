"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  DollarSign,
  Heart,
  Wallet,
  AlertTriangle,
  ExternalLink,
  Activity,
  Droplets,
  Globe,
  Database,
} from "lucide-react"

// Liquidity Pool Configuration
const LIQUIDITY_POOL_ID = "befdfc5b6b89a4e1def19e08ad964257b826657a3293c3e1f668bdb72ae8d1ea"
const LIQUIDITY_PROVIDER_WALLET = "GAALODFU5N247F4GQMOSBSZWDYFA3VUBFUU4OCO6YTPPA4HM66VSEXZA"

interface TransactionDetail {
  id: string
  date: string
  type: "trade" | "payment" | "liquidity"
  hollowvoxAmount: number
  xlmAmount: number
  price: number
  issuer: string
  counterparty?: string
  poolShares?: number
}

interface WalletMetrics {
  address: string
  name: string
  color: string
  description: string
  currentBalances: { [key: string]: string }
  totalHollowvoxSold: number
  totalXlmReceived: number
  averageSellPrice: number
  estimatedProfit: number
  actionFundAllocation: number
  impactFundAllocation: number
  totalLiquidityProvided: number
  transactionCount: number
  lastTransactionDate: string
  recentTransactions: TransactionDetail[]
  lastUpdated: string
  error?: string
}

interface ProfitTrackerData {
  wallets: WalletMetrics[]
  combinedProfit: number
  combinedActionFund: number
  combinedImpactFund: number
  combinedLiquidity: number
  totalTransactions: number
  lastRefresh: string
  refreshId: string
}

export function ProfitTracker() {
  const [data, setData] = useState<ProfitTrackerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showTransactions, setShowTransactions] = useState<string | null>(null)

  const fetchDataFromDatabase = async () => {
    try {
      setError(null)

      const response = await fetch("/api/profit-tracker/data", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch profit tracker data")
      }

      setData(result.data)
    } catch (err) {
      console.error("❌ Error fetching data from database:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch profit tracker data")
    }
  }

  const updateFromStellar = async () => {
    try {
      setIsUpdating(true)
      setError(null)

      const response = await fetch("/api/profit-tracker/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to update profit tracker data")
      }

      // Refresh the display with updated data
      await fetchDataFromDatabase()
    } catch (err) {
      console.error("❌ Error updating from Stellar:", err)
      setError(err instanceof Error ? err.message : "Failed to update from Stellar network")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDataFromDatabase()
    setIsRefreshing(false)
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchDataFromDatabase()
      setIsLoading(false)
    }

    loadData()

    // Auto-refresh from database every 5 minutes (reduced frequency)
    const interval = setInterval(fetchDataFromDatabase, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            HOLLOWVOX Token Tracker
          </CardTitle>
          <CardDescription>Loading token data from database...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            HOLLOWVOX Token Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button onClick={updateFromStellar} disabled={isUpdating} variant="outline">
              <Database className={`h-4 w-4 mr-2 ${isUpdating ? "animate-spin" : ""}`} />
              Update from Stellar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              HOLLOWVOX Token Tracker
              <Database className="h-5 w-5 text-blue-400" title="Database-powered" />
            </CardTitle>
            <CardDescription className="mt-2">
              Profit tracking from Stellar network • Last updated: {data.lastRefresh}
              <span className="text-blue-400 ml-2">• Database-powered</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={updateFromStellar}
              variant="default"
              size="sm"
              disabled={isUpdating}
              className="bg-primary hover:bg-primary/90"
            >
              <Database className={`h-4 w-4 mr-2 ${isUpdating ? "animate-spin" : ""}`} />
              {isUpdating ? "Updating..." : "Update from Stellar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">{data.combinedProfit.toFixed(2)} XLM</div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">{data.combinedActionFund.toFixed(2)} XLM</div>
            <div className="text-sm text-muted-foreground">$ACTION Fund</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Heart className="h-8 w-8 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-pink-400">{data.combinedImpactFund.toFixed(2)} XLM</div>
            <div className="text-sm text-muted-foreground">Impact Fund</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Droplets className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">{data.combinedLiquidity.toFixed(2)} XLM</div>
            <div className="text-sm text-muted-foreground">Liquidity Provided</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Activity className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">{data.totalTransactions}</div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Badge variant="outline" className="border-primary text-primary mb-2">
              Action Token
            </Badge>
            <div className="text-lg font-bold">20%</div>
            <div className="text-sm text-muted-foreground">Total Commitment</div>
          </div>
        </div>

        {/* Action Token Commitment Breakdown */}
        <Alert className="border-primary/50 bg-primary/10">
          <Heart className="h-4 w-4 text-primary" />
          <AlertDescription className="text-white">
            <strong>Action Token Commitment:</strong> 20% of profits committed to good -{" "}
            {data.combinedActionFund.toFixed(2)} XLM for $ACTION token purchases and giveaways +{" "}
            {data.combinedImpactFund.toFixed(2)} XLM for Impact Fund donations
            {data.combinedLiquidity > 0 && (
              <span>
                {" "}
                + {data.combinedLiquidity.toFixed(2)} XLM provided to XLM/HOLLOWVOX liquidity pool for ecosystem growth
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Wallet Details */}
        <div className="space-y-4">
          <h3 className="font-orbitron text-xl font-bold">Tracked Wallets</h3>
          {data.wallets.map((wallet) => (
            <Card key={wallet.address} className="bg-muted/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-6 w-6" style={{ color: wallet.color }} />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {wallet.name}
                        {wallet.address === LIQUIDITY_PROVIDER_WALLET && (
                          <Badge variant="outline" className="border-blue-400 text-blue-400">
                            <Droplets className="h-3 w-3 mr-1" />
                            LP
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">{wallet.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTransactions(showTransactions === wallet.address ? null : wallet.address)}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      {showTransactions === wallet.address ? "Hide" : "Show"} Transactions
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <a
                        href={`https://stellar.expert/explorer/public/account/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on StellarExpert"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {wallet.error ? (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">Error: {wallet.error}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {/* Current Balances */}
                    <div className="bg-muted/20 rounded-lg p-3">
                      <h4 className="font-semibold mb-2 text-sm">Current Balances</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {Object.entries(wallet.currentBalances).map(([asset, balance]) => (
                          <div key={asset} className="text-center">
                            <div className="text-muted-foreground">{asset}</div>
                            <div className="font-mono font-bold">{Number.parseFloat(balance).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trading Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">HOLLOWVOX Sold</div>
                        <div className="font-mono font-bold">{wallet.totalHollowvoxSold.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">XLM Received</div>
                        <div className="font-mono font-bold text-green-400">{wallet.totalXlmReceived.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Price</div>
                        <div className="font-mono font-bold">{wallet.averageSellPrice.toFixed(6)} XLM</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">$ACTION Fund</div>
                        <div className="font-mono font-bold text-primary">
                          {wallet.actionFundAllocation.toFixed(2)} XLM
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Impact Fund</div>
                        <div className="font-mono font-bold text-pink-400">
                          {wallet.impactFundAllocation.toFixed(2)} XLM
                        </div>
                      </div>
                    </div>

                    {/* Liquidity Metrics (only for LP wallet) */}
                    {wallet.address === LIQUIDITY_PROVIDER_WALLET && wallet.totalLiquidityProvided > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-400" />
                          Liquidity Pool Contributions
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Total LP Value</div>
                            <div className="font-mono font-bold text-blue-400">
                              {wallet.totalLiquidityProvided.toFixed(2)} XLM
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">LP Transactions</div>
                            <div className="font-mono font-bold">
                              {wallet.recentTransactions.filter((tx) => tx.type === "liquidity").length}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Pool Link</div>
                            <Button variant="ghost" size="sm" className="h-6 p-1" asChild>
                              <a
                                href={`https://stellar.expert/explorer/public/liquidity-pool/${LIQUIDITY_POOL_ID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Transactions: {wallet.transactionCount}</span>
                      <span>Last Activity: {wallet.lastTransactionDate}</span>
                      <span>Last Updated: {wallet.lastUpdated}</span>
                    </div>

                    {/* Transaction Details */}
                    {showTransactions === wallet.address && wallet.recentTransactions.length > 0 && (
                      <div className="mt-4 border-t border-border/50 pt-4">
                        <h4 className="font-semibold mb-3">Recent Transactions</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {wallet.recentTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-2 rounded text-sm bg-muted/20"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    tx.type === "trade"
                                      ? "border-green-500 text-green-400"
                                      : tx.type === "liquidity"
                                        ? "border-blue-500 text-blue-400"
                                        : "border-purple-500 text-purple-400"
                                  }
                                >
                                  {tx.type === "liquidity" ? "LP" : tx.type}
                                </Badge>
                                <span className="text-muted-foreground">{tx.date}</span>
                              </div>
                              <div className="text-right font-mono">
                                {tx.type === "trade" ? (
                                  <div>
                                    <div className="text-green-400">+{tx.xlmAmount.toFixed(2)} XLM</div>
                                    <div className="text-xs text-muted-foreground">
                                      -{tx.hollowvoxAmount.toLocaleString()} HOLLOWVOX
                                    </div>
                                  </div>
                                ) : tx.type === "liquidity" ? (
                                  <div>
                                    <div className="text-blue-400">LP: {tx.xlmAmount.toFixed(2)} XLM</div>
                                    <div className="text-xs text-muted-foreground">
                                      +{tx.hollowvoxAmount.toLocaleString()} HOLLOWVOX
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-purple-400">+{tx.xlmAmount.toFixed(2)} XLM</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center border-t border-border/50 pt-4 space-y-1">
          <p>* Profit calculations based on XLM received from HOLLOWVOX token trades on Stellar DEX</p>
          <p>** Tracking HOLLOWVOX tokens from issuers: HOLLOWVOX-1 (...LMAX) and HOLLOWVOX-2 (...EJLF)</p>
          <p>
            *** 20% of all profits automatically allocated: 10% for $ACTION token purchases + 10% for Impact Fund
            donations + liquidity provision as part of Action Token commitment
          </p>
          <p>**** Liquidity pool tracking: XLM/HOLLOWVOX pool ({LIQUIDITY_POOL_ID.slice(-8)})</p>
          <p className="text-blue-400">***** All data stored in Neon database for fast, reliable access</p>
        </div>
      </CardContent>
    </Card>
  )
}
