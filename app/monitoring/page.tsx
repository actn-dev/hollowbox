"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, Activity, Eye, AlertTriangle, Plus, RefreshCw } from "lucide-react"

interface SuspiciousLog {
  wallet: string
  type: string
  asset: string
  amount: string
  timestamp: string
  transaction_hash: string
  received_at: string
}

interface WatchlistEntry {
  wallet: string
  status: "passive" | "active"
  added_at: string
  updated_at: string
}

export default function MonitoringPage() {
  const [logs, setLogs] = useState<SuspiciousLog[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [newWallet, setNewWallet] = useState("")
  const [newStatus, setNewStatus] = useState<"passive" | "active">("passive")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [logsResponse, watchlistResponse] = await Promise.all([fetch("/api/log-activity"), fetch("/api/watchlist")])

      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs || [])
      }

      if (watchlistResponse.ok) {
        const watchlistData = await watchlistResponse.json()
        setWatchlist(watchlistData.watchlist || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setMessage({ type: "error", text: "Failed to fetch monitoring data" })
    } finally {
      setIsLoading(false)
    }
  }

  const updateWatchlistEntry = async (wallet: string, status: "passive" | "active") => {
    try {
      const response = await fetch("/api/watchlist/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, status }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Watchlist updated successfully" })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.error || "Failed to update watchlist" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update watchlist" })
    }
  }

  const addWatchlistEntry = async () => {
    if (!newWallet.trim()) {
      setMessage({ type: "error", text: "Please enter a wallet address" })
      return
    }

    await updateWatchlistEntry(newWallet.trim(), newStatus)
    setNewWallet("")
    setNewStatus("passive")
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Eye className="h-3 w-3 mr-1" />
        Passive
      </Badge>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatWalletAddress = (address: string) => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  if (isLoading) {
    return (
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            HOLLOWVOX Monitoring
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Monitor suspicious wallet activity and manage threat response for HOLLOWVOX token security
          </p>
        </div>

        {message && (
          <Alert
            className={`${message.type === "error" ? "border-red-500/50 bg-red-500/10" : "border-green-500/50 bg-green-500/10"}`}
          >
            <AlertDescription className={message.type === "error" ? "text-red-200" : "text-green-200"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suspicious Logs</p>
                  <p className="text-2xl font-bold text-red-400">{logs.length}</p>
                </div>
                <Activity className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monitored Wallets</p>
                  <p className="text-2xl font-bold text-yellow-400">{watchlist.length}</p>
                </div>
                <Eye className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Threats</p>
                  <p className="text-2xl font-bold text-green-400">
                    {watchlist.filter((w) => w.status === "active").length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">Suspicious Activity</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist Management</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                    <Activity className="h-6 w-6 text-red-400" />
                    Suspicious Activity Logs
                  </CardTitle>
                  <CardDescription>
                    Recent suspicious wallet activities detected by the monitoring system
                  </CardDescription>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No suspicious activity detected yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={index} className="p-4 bg-muted/20 rounded-lg border border-red-500/20">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive" className="text-xs">
                                {log.type.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{formatDateTime(log.received_at)}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Wallet:</span>
                                <div className="font-mono text-xs break-all">{formatWalletAddress(log.wallet)}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Asset:</span>
                                <div className="font-medium">{log.asset}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Amount:</span>
                                <div className="font-medium">{log.amount}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">TX Hash:</span>
                                <div className="font-mono text-xs break-all">
                                  {formatWalletAddress(log.transaction_hash)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6">
            {/* Add New Wallet */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Plus className="h-6 w-6 text-primary" />
                  Add Wallet to Watchlist
                </CardTitle>
                <CardDescription>Monitor new wallet addresses for suspicious activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input
                      id="wallet"
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                      placeholder="GAMPLEHPKGQVURMWCZUKGTJKIBEYBDQZQHLY4VEG2JQNVTQR7WJRKGXGR"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newStatus} onValueChange={(value: "passive" | "active") => setNewStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passive">Passive (Monitor Only)</SelectItem>
                        <SelectItem value="active">Active (Combat)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addWatchlistEntry} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Watchlist
                </Button>
              </CardContent>
            </Card>

            {/* Watchlist Management */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Watchlist Management
                </CardTitle>
                <CardDescription>Manage monitored wallet addresses and their response status</CardDescription>
              </CardHeader>
              <CardContent>
                {watchlist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No wallets in watchlist yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {watchlist.map((entry, index) => (
                      <div key={index} className="p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono text-sm break-all">{entry.wallet}</span>
                              {getStatusBadge(entry.status)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Added: {formatDateTime(entry.added_at)} | Updated: {formatDateTime(entry.updated_at)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={entry.status}
                              onValueChange={(value: "passive" | "active") => updateWatchlistEntry(entry.wallet, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passive">Passive</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
