"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  AlertTriangle,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  Send,
  Settings,
  Wallet,
  Zap,
} from "lucide-react"

interface TradeDetail {
  index: number
  id: string
  date: string
  baseAccount: string
  counterAccount: string
  baseAsset: string
  counterAsset: string
  baseAmount: string
  counterAmount: string
  baseIsSeller: boolean
  walletRole: string
  analysis: string
  isSelling: boolean
  hollowvoxAmount: number
  xlmAmount: number
  issuer: string
  calculatedPrice: number
  reason?: string
}

interface PaymentDetail {
  id: string
  date: string
  from: string
  to: string
  amount: string
  asset: string
  type: string
  transactionHash: string
}

interface PaymentSale {
  id: string
  date: string
  from: string
  to: string
  amount: string
  asset: string
  type: string
  transactionHash: string
  analysis: string
  hollowvoxAmount: number
}

interface OperationDetail {
  id: string
  date: string
  type: string
  transactionHash: string
  details: any
}

interface EffectDetail {
  id: string
  date: string
  type: string
  account: string
  details: any
}

interface DebugResult {
  walletAddress: string
  accountExists: boolean
  accountBalances: any[]
  totalTrades: number
  totalPayments: number
  totalOperations: number
  totalEffects: number
  hollowvoxTrades: TradeDetail[]
  totalHollowvoxSold: number
  totalXlmReceived: number
  skippedTrades: TradeDetail[]
  issuersFound: string[]
  hollowvoxPayments: PaymentDetail[]
  hollowvoxOperations: OperationDetail[]
  hollowvoxEffects: EffectDetail[]
  paymentSales: PaymentSale[]
  hollowvoxTradesCount: number
  skippedTradesCount: number
  hollowvoxPaymentsCount: number
  hollowvoxOperationsCount: number
  hollowvoxEffectsCount: number
  paymentSalesCount: number
  averagePrice: number
  estimatedProfit: number
  actionFund: number
  impactFund: number
}

export function ProfitDebug() {
  const [walletAddress, setWalletAddress] = useState("GC3XYCFXLX26RS34VMEZNVOMWXHBQ3AKPVPAEKK3OSRHB4X56CPXTU52")
  const [isLoading, setIsLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runDebug = async () => {
    if (!walletAddress.trim()) {
      setError("Please enter a wallet address")
      return
    }

    setIsLoading(true)
    setError(null)
    setDebugResult(null)

    try {
      const response = await fetch("/api/profit-tracker/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: walletAddress.trim() }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Debug failed")
      }

      setDebugResult(result.debug)
    } catch (err) {
      console.error("Debug error:", err)
      setError(err instanceof Error ? err.message : "Debug failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Enhanced Profit Tracker Debug Tool
          </CardTitle>
          <CardDescription>
            Comprehensive analysis of trades, payments, operations, and effects to identify profit calculation issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Stellar wallet address (G...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="flex-1"
            />
            <Button onClick={runDebug} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Debugging..." : "Debug"}
            </Button>
          </div>

          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {debugResult && (
        <div className="space-y-6">
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Activity className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{debugResult.totalTrades}</div>
                  <div className="text-sm text-muted-foreground">Trades</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Send className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{debugResult.totalPayments}</div>
                  <div className="text-sm text-muted-foreground">Payments</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Settings className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{debugResult.totalOperations}</div>
                  <div className="text-sm text-muted-foreground">Operations</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <Zap className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{debugResult.totalEffects}</div>
                  <div className="text-sm text-muted-foreground">Effects</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">{debugResult.hollowvoxTradesCount}</div>
                  <div className="text-sm text-muted-foreground">HVX Sales</div>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-lg">
                  <DollarSign className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-400">{debugResult.estimatedProfit.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">XLM Profit</div>
                </div>
              </div>

              {/* HOLLOWVOX Activity Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-lg font-bold text-green-400">{debugResult.hollowvoxTradesCount}</div>
                  <div className="text-xs text-muted-foreground">HVX Trade Sales</div>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-lg font-bold text-blue-400">{debugResult.hollowvoxPaymentsCount}</div>
                  <div className="text-xs text-muted-foreground">HVX Payments</div>
                </div>
                <div className="text-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-lg font-bold text-purple-400">{debugResult.paymentSalesCount}</div>
                  <div className="text-xs text-muted-foreground">Potential Payment Sales</div>
                </div>
                <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="text-lg font-bold text-orange-400">{debugResult.hollowvoxOperationsCount}</div>
                  <div className="text-xs text-muted-foreground">HVX Operations</div>
                </div>
              </div>

              {/* Account Balances */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Current Account Balances</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {debugResult.accountBalances.map((balance, index) => (
                    <div key={index} className="p-2 bg-muted/10 rounded text-sm">
                      <div className="font-mono font-bold">{Number.parseFloat(balance.balance).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {balance.asset_code || "XLM"}
                        {balance.asset_issuer && `-${balance.asset_issuer.slice(-4)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="profitable" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profitable">Sales ({debugResult.hollowvoxTradesCount})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({debugResult.hollowvoxPaymentsCount})</TabsTrigger>
              <TabsTrigger value="payment-sales">P-Sales ({debugResult.paymentSalesCount})</TabsTrigger>
              <TabsTrigger value="operations">Ops ({debugResult.hollowvoxOperationsCount})</TabsTrigger>
              <TabsTrigger value="effects">Effects ({debugResult.hollowvoxEffectsCount})</TabsTrigger>
              <TabsTrigger value="skipped">Skipped ({debugResult.skippedTradesCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="profitable" className="space-y-4">
              {debugResult.hollowvoxTrades.length > 0 ? (
                <Card className="border-green-500/20">
                  <CardHeader className="bg-green-500/5">
                    <CardTitle className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      Profitable HOLLOWVOX Sales from Trades ({debugResult.hollowvoxTrades.length})
                    </CardTitle>
                    <CardDescription>
                      These transactions were counted as profit and contributed to your total earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {debugResult.hollowvoxTrades.map((trade, index) => (
                        <div
                          key={trade.id}
                          className="p-4 border-b border-green-500/10 hover:bg-green-500/5 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-green-500 text-green-400">
                                Sale #{index + 1}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {new Date(trade.date).toLocaleDateString()} {new Date(trade.date).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-green-400 text-lg">
                                +{trade.xlmAmount.toFixed(2)} XLM
                              </div>
                              <div className="text-xs text-muted-foreground">
                                -{trade.hollowvoxAmount.toLocaleString()} HVX
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div>
                                <span className="text-muted-foreground">Price per HVX:</span>
                                <span className="ml-2 font-mono font-bold">{trade.calculatedPrice.toFixed(6)} XLM</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Wallet Role:</span>
                                <span className="ml-2 capitalize">{trade.walletRole} account</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Issuer:</span>
                                <span className="ml-2 font-mono">...{trade.issuer}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-muted-foreground">Trade Analysis:</span>
                                <div className="text-xs mt-1 p-2 bg-muted/20 rounded">{trade.analysis}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-200">
                    <strong>No profitable HOLLOWVOX sales found in trades!</strong> Check the other tabs to see if sales
                    are happening through payments or operations.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {debugResult.hollowvoxPayments.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>HOLLOWVOX Payments ({debugResult.hollowvoxPayments.length})</CardTitle>
                    <CardDescription>Direct HOLLOWVOX token transfers</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {debugResult.hollowvoxPayments.map((payment, index) => (
                        <div key={payment.id} className="p-4 border-b hover:bg-muted/5 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant={payment.type === "sent" ? "destructive" : "default"}>
                                {payment.type}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(payment.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground mt-1">
                                TX: ...{payment.transactionHash.slice(-8)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold">
                                {payment.type === "sent" ? "-" : "+"}
                                {Number.parseFloat(payment.amount).toLocaleString()} {payment.asset}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {payment.type === "sent"
                                  ? `To: ...${payment.to.slice(-4)}`
                                  : `From: ...${payment.from.slice(-4)}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground">No HOLLOWVOX payments found</div>
              )}
            </TabsContent>

            <TabsContent value="payment-sales" className="space-y-4">
              {debugResult.paymentSales.length > 0 ? (
                <Card className="border-purple-500/20">
                  <CardHeader className="bg-purple-500/5">
                    <CardTitle className="flex items-center gap-2 text-purple-400">
                      <Send className="h-5 w-5" />
                      Potential Sales from Payments ({debugResult.paymentSales.length})
                    </CardTitle>
                    <CardDescription>
                      HOLLOWVOX tokens sent from your wallet - these might be sales if there's corresponding XLM
                      received
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {debugResult.paymentSales.map((sale, index) => (
                        <div
                          key={sale.id}
                          className="p-4 border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-purple-500 text-purple-400">
                                P-Sale #{index + 1}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {new Date(sale.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-purple-400">
                                -{sale.hollowvoxAmount.toLocaleString()} HVX
                              </div>
                              <div className="text-xs text-muted-foreground">To: ...{sale.to.slice(-4)}</div>
                            </div>
                          </div>
                          <div className="text-sm">
                            <div className="p-2 bg-purple-500/10 rounded text-purple-200 text-xs">{sale.analysis}</div>
                            <div className="mt-2 text-xs text-muted-foreground">
                              TX: ...{sale.transactionHash.slice(-8)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground">No potential payment sales found</div>
              )}
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              {debugResult.hollowvoxOperations.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>HOLLOWVOX Operations ({debugResult.hollowvoxOperations.length})</CardTitle>
                    <CardDescription>All HOLLOWVOX-related operations</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {debugResult.hollowvoxOperations.map((operation, index) => (
                        <div key={operation.id} className="p-4 border-b hover:bg-muted/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge variant="outline">{operation.type}</Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(operation.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground mt-1">
                                TX: ...{operation.transactionHash.slice(-8)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs space-y-1">
                            {Object.entries(operation.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-muted-foreground">{key}:</span> {value || "N/A"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground">No HOLLOWVOX operations found</div>
              )}
            </TabsContent>

            <TabsContent value="effects" className="space-y-4">
              {debugResult.hollowvoxEffects.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>HOLLOWVOX Effects ({debugResult.hollowvoxEffectsCount})</CardTitle>
                    <CardDescription>Account effects related to HOLLOWVOX transactions</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {debugResult.hollowvoxEffects.map((effect, index) => (
                        <div key={effect.id} className="p-4 border-b hover:bg-muted/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Badge variant="outline">{effect.type}</Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(effect.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs font-mono text-muted-foreground mt-1">
                                Account: ...{effect.account.slice(-4)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs space-y-1">
                            {Object.entries(effect.details).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-muted-foreground">{key}:</span> {value || "N/A"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground">No HOLLOWVOX effects found</div>
              )}
            </TabsContent>

            <TabsContent value="skipped" className="space-y-4">
              {debugResult.skippedTrades.length > 0 ? (
                <Card className="border-yellow-500/20">
                  <CardHeader className="bg-yellow-500/5">
                    <CardTitle className="flex items-center gap-2 text-yellow-400">
                      <XCircle className="h-5 w-5" />
                      Skipped Trades ({debugResult.skippedTrades.length})
                    </CardTitle>
                    <CardDescription>Trades that were not counted as HOLLOWVOX sales</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-96 overflow-y-auto">
                      {debugResult.skippedTrades.slice(0, 20).map((trade, index) => (
                        <div
                          key={trade.id || index}
                          className="p-4 border-b border-yellow-500/10 hover:bg-yellow-500/5 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                                Skipped #{index + 1}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {new Date(trade.date).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="font-mono">
                                {trade.baseAsset} → {trade.counterAsset}
                              </div>
                              <div className="text-muted-foreground">
                                {trade.baseAmount} → {trade.counterAmount}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Skip Reason:</span>
                              <div className="mt-1 p-2 bg-yellow-500/10 rounded text-yellow-200">{trade.reason}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                              <div>
                                <span>Wallet Role:</span> {trade.walletRole} account
                              </div>
                              <div>
                                <span>Base is Seller:</span> {trade.baseIsSeller ? "Yes" : "No"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground">No skipped trades found</div>
              )}
            </TabsContent>
          </Tabs>

          {/* Issuers Found */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Issuers Found in Account Activity</CardTitle>
              <CardDescription>All unique asset issuers discovered across all transaction types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {debugResult.issuersFound.map((issuer) => (
                  <Badge key={issuer} variant="outline" className="font-mono text-xs">
                    ...{issuer.slice(-8)}
                  </Badge>
                ))}
              </div>
              {debugResult.issuersFound.length === 0 && (
                <div className="text-muted-foreground text-sm">No asset issuers found</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
