"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/contexts/wallet-context"
import { Coins, Gift, Clock, CheckCircle, Zap, Trophy } from "lucide-react"

interface GameReward {
  id: number
  game_type: string
  tokens_earned: number
  earned_at: string
  session_id?: string
}

interface RewardClaim {
  id: number
  tokens_claimed: number
  status: string
  claimed_at: string
  sent_at?: string
}

interface RewardData {
  totalEarned: number
  totalClaimed: number
  availableBalance: number
  recentRewards: GameReward[]
  pendingClaims: RewardClaim[]
}

export function GameRewardsTracker() {
  const { isConnected, publicKey } = useWallet()
  const [rewardData, setRewardData] = useState<RewardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (isConnected && publicKey) {
      fetchRewardData()
    }
  }, [isConnected, publicKey])

  const fetchRewardData = async () => {
    if (!publicKey) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/game-rewards/balance?walletAddress=${publicKey}`)
      if (response.ok) {
        const data = await response.json()
        setRewardData(data)
      }
    } catch (error) {
      console.error("Error fetching reward data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const claimTokens = async (amount: number) => {
    if (!publicKey || !rewardData) return

    try {
      setIsClaiming(true)
      const response = await fetch("/api/game-rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey,
          amount: amount,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: result.message })
        fetchRewardData() // Refresh data
      } else {
        setMessage({ type: "error", text: result.error })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to claim tokens" })
    } finally {
      setIsClaiming(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getGameTypeIcon = (gameType: string) => {
    switch (gameType) {
      case "signal-hunt":
        return <Zap className="h-4 w-4" />
      case "rhythm-game":
        return <Trophy className="h-4 w-4" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "sent":
        return (
          <Badge variant="outline" className="border-green-500 text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!isConnected) {
    return null
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!rewardData) {
    return null
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-xl flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Game Rewards
        </CardTitle>
        <CardDescription>Track and claim your HOLLOWVOX tokens earned from mini games</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert
            className={`${message.type === "error" ? "border-red-500/50 bg-red-500/10" : "border-green-500/50 bg-green-500/10"}`}
          >
            <AlertDescription className={message.type === "error" ? "text-red-200" : "text-green-200"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Gift className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-green-400">{rewardData.availableBalance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Available to Claim</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-yellow-400">
              {rewardData.pendingClaims.filter((c) => c.status === "pending").length}
            </div>
            <div className="text-xs text-muted-foreground">Pending Claims</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Zap className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-blue-400">{rewardData.totalEarned.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Earned</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-purple-400">{rewardData.totalClaimed.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Claimed</div>
          </div>
        </div>

        {/* Claim Actions */}
        {rewardData.availableBalance > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => claimTokens(rewardData.availableBalance)} disabled={isClaiming} className="flex-1">
              <Coins className="h-4 w-4 mr-2" />
              Claim All ({rewardData.availableBalance.toLocaleString()} tokens)
            </Button>
            {rewardData.availableBalance >= 2 && (
              <Button
                onClick={() => claimTokens(Math.floor(rewardData.availableBalance / 2))}
                disabled={isClaiming}
                variant="outline"
                className="flex-1 bg-transparent"
              >
                <Gift className="h-4 w-4 mr-2" />
                Claim Half ({Math.floor(rewardData.availableBalance / 2).toLocaleString()} tokens)
              </Button>
            )}
          </div>
        )}

        {rewardData.availableBalance === 0 && rewardData.pendingClaims.some((c) => c.status === "pending") && (
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              You have pending token claims that will be sent manually by admin.
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Rewards */}
        {rewardData.recentRewards.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Recent Rewards</h4>
            <div className="space-y-2">
              {rewardData.recentRewards.slice(0, 5).map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getGameTypeIcon(reward.game_type)}
                    <div>
                      <div className="font-medium capitalize">{reward.game_type.replace("-", " ")}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(reward.earned_at)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-400">+{reward.tokens_earned.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Claims */}
        {rewardData.pendingClaims.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Recent Claims</h4>
            <div className="space-y-2">
              {rewardData.pendingClaims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <div className="font-medium">{claim.tokens_claimed.toLocaleString()} tokens</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(claim.claimed_at)}</div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(claim.status)}
                    {claim.sent_at && (
                      <div className="text-xs text-muted-foreground mt-1">Sent: {formatDateTime(claim.sent_at)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
