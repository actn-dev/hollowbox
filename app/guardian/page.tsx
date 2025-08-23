"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Activity,
  Eye,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react"

interface SuspiciousLog {
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

interface WatchlistEntry {
  id?: number
  wallet: string
  status: "passive" | "active"
  added_at: string
  updated_at: string
  created_by?: string
  notes?: string
}

type SortField = "wallet" | "amount" | "timestamp" | "received_at"
type SortDirection = "asc" | "desc"

export default function GuardianPage() {
  const [logs, setLogs] = useState<SuspiciousLog[]>([])
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [sortField, setSortField] = useState<SortField>("received_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [groupByWallet, setGroupByWallet] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const [newWalletStatus, setNewWalletStatus] = useState<"passive" | "active">("passive")
  const [newWalletNotes, setNewWalletNotes] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

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

  const updateWatchlistStatus = async (wallet: string, status: "passive" | "active") => {
    try {
      const response = await fetch("/api/watchlist/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, status }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: `Wallet status updated to ${status}` })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.error || "Failed to update watchlist" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update watchlist" })
    }
  }

  const addWalletToWatchlist = async () => {
    if (!newWalletAddress.trim()) {
      setMessage({ type: "error", text: "Please enter a wallet address" })
      return
    }

    // Basic Stellar address validation
    if (!newWalletAddress.match(/^G[A-Z0-9]{55}$/)) {
      setMessage({ type: "error", text: "Invalid Stellar wallet address format" })
      return
    }

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: newWalletAddress.trim(),
          status: newWalletStatus,
          notes: newWalletNotes.trim() || undefined,
        }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Wallet added to watchlist successfully" })
        setNewWalletAddress("")
        setNewWalletStatus("passive")
        setNewWalletNotes("")
        setIsAddDialogOpen(false)
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.error || "Failed to add wallet to watchlist" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add wallet to watchlist" })
    }
  }

  const removeWalletFromWatchlist = async (wallet: string) => {
    if (
      !confirm(`Are you sure you want to remove wallet ${wallet.slice(0, 8)}...${wallet.slice(-8)} from the watchlist?`)
    ) {
      return
    }

    try {
      const response = await fetch(`/api/watchlist?wallet=${encodeURIComponent(wallet)}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Wallet removed from watchlist successfully" })
        fetchData() // Refresh data
      } else {
        const errorData = await response.json()
        setMessage({ type: "error", text: errorData.error || "Failed to remove wallet from watchlist" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove wallet from watchlist" })
    }
  }

  const sortLogs = (logs: SuspiciousLog[]) => {
    return [...logs].sort((a, b) => {
      let aValue: string | number = a[sortField]
      let bValue: string | number = b[sortField]

      if (sortField === "amount") {
        aValue = Number.parseFloat(a.amount) || 0
        bValue = Number.parseFloat(b.amount) || 0
      } else if (sortField === "timestamp" || sortField === "received_at") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const groupLogsByWallet = (logs: SuspiciousLog[]) => {
    const grouped = logs.reduce(
      (acc, log) => {
        if (!acc[log.wallet]) {
          acc[log.wallet] = []
        }
        acc[log.wallet].push(log)
        return acc
      },
      {} as Record<string, SuspiciousLog[]>,
    )

    return Object.entries(grouped).map(([wallet, logs]) => ({
      wallet,
      logs: sortLogs(logs),
      totalAmount: logs.reduce((sum, log) => sum + (Number.parseFloat(log.amount) || 0), 0),
      latestActivity: logs.reduce(
        (latest, log) => (new Date(log.received_at) > new Date(latest) ? log.received_at : latest),
        logs[0]?.received_at || "",
      ),
    }))
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatWalletAddress = (address: string) => {
    if (address.length <= 12) return address
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  const formatTransactionHash = (hash: string) => {
    if (hash.length <= 16) return hash
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Combat Mode
      </Badge>
    ) : (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        <Eye className="h-3 w-3 mr-1" />
        Monitor Only
      </Badge>
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
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

  const sortedLogs = sortLogs(logs)
  const groupedLogs = groupLogsByWallet(logs)

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            Guardian Control Center
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Monitor and respond to suspicious HOLLOWVOX token activity in real-time
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
                  <p className="text-sm text-muted-foreground">Combat Mode</p>
                  <p className="text-2xl font-bold text-green-400">
                    {watchlist.filter((w) => w.status === "active").length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suspicious Activity Logs */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6 text-red-400" />
                Suspicious Trade Logs
              </CardTitle>
              <CardDescription>Recent suspicious wallet activities detected by the monitoring system</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setGroupByWallet(!groupByWallet)} variant="outline" size="sm">
                {groupByWallet ? "Show All" : "Group by Wallet"}
              </Button>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No suspicious activity detected yet</p>
              </div>
            ) : groupByWallet ? (
              <div className="space-y-6">
                {groupedLogs.map((group, index) => (
                  <div key={index} className="border border-border/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-mono text-sm font-medium">{formatWalletAddress(group.wallet)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {group.logs.length} transactions • Total: {group.totalAmount.toFixed(2)} HOLLOWVOX
                        </p>
                      </div>
                      <Badge variant="outline">{formatDateTime(group.latestActivity)}</Badge>
                    </div>
                    <div className="space-y-2">
                      {group.logs.map((log, logIndex) => (
                        <div key={logIndex} className="grid grid-cols-4 gap-4 text-sm p-2 bg-muted/20 rounded">
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <div className="font-medium">{log.type}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <div className="font-medium">{log.amount}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">TX Hash:</span>
                            <div className="font-mono text-xs">{formatTransactionHash(log.transaction_hash)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Time:</span>
                            <div className="text-xs">{formatDateTime(log.received_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("wallet")}>
                        <div className="flex items-center">
                          Wallet
                          <SortIcon field="wallet" />
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("amount")}>
                        <div className="flex items-center">
                          Amount
                          <SortIcon field="amount" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("timestamp")}>
                        <div className="flex items-center">
                          Timestamp
                          <SortIcon field="timestamp" />
                        </div>
                      </TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("received_at")}>
                        <div className="flex items-center">
                          Received
                          <SortIcon field="received_at" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{formatWalletAddress(log.wallet)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.asset}</TableCell>
                        <TableCell className="font-medium">{log.amount}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.timestamp)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatTransactionHash(log.transaction_hash)}
                        </TableCell>
                        <TableCell className="text-sm">{formatDateTime(log.received_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watchlist Management */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Watchlist Management
              </CardTitle>
              <CardDescription>Manage monitored wallet addresses and their response status</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary/20 hover:bg-primary/30 border-primary/50">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Wallet to Watchlist</DialogTitle>
                  <DialogDescription>
                    Enter a Stellar wallet address to monitor for suspicious activity
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="wallet-address" className="text-sm font-medium">
                      Wallet Address
                    </label>
                    <Input
                      id="wallet-address"
                      placeholder="GAMPLEHPKGQVURMWCZUKGTJKIBEYBDQZQHLY4VEG2JQNVTQR7WJRKGXGR"
                      value={newWalletAddress}
                      onChange={(e) => setNewWalletAddress(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="wallet-status" className="text-sm font-medium">
                      Initial Status
                    </label>
                    <Select
                      value={newWalletStatus}
                      onValueChange={(value: "passive" | "active") => setNewWalletStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passive">Monitor Only</SelectItem>
                        <SelectItem value="active">Combat Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="wallet-notes" className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <Textarea
                      id="wallet-notes"
                      placeholder="Reason for monitoring this wallet..."
                      value={newWalletNotes}
                      onChange={(e) => setNewWalletNotes(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addWalletToWatchlist}>Add to Watchlist</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {watchlist.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No wallets in watchlist yet</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Wallet
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watchlist.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{entry.wallet}</TableCell>
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(entry.added_at)}</TableCell>
                        <TableCell className="text-sm">{formatDateTime(entry.updated_at)}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {entry.notes || <span className="text-muted-foreground">No notes</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Select
                              value={entry.status}
                              onValueChange={(value: "passive" | "active") =>
                                updateWatchlistStatus(entry.wallet, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="passive">Monitor Only</SelectItem>
                                <SelectItem value="active">Combat Mode</SelectItem>
                              </SelectContent>
                            </Select>
                            {entry.status === "passive" && (
                              <Button
                                onClick={() => updateWatchlistStatus(entry.wallet, "active")}
                                variant="destructive"
                                size="sm"
                              >
                                Approve Combat Mode
                              </Button>
                            )}
                            <Button
                              onClick={() => removeWalletFromWatchlist(entry.wallet)}
                              variant="outline"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
