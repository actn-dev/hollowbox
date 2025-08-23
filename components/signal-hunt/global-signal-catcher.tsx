"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/contexts/wallet-context"
import { Zap, Clock, Target, AlertCircle, Radio } from "lucide-react"

interface GlobalSignalState {
  isActive: boolean
  tokensEarned: number
  maxTokens: number
  timeRemaining: number
  nextResetTime: string
  canCatch: boolean
}

export function GlobalSignalCatcher() {
  const { isConnected, publicKey } = useWallet()
  const [signalState, setSignalState] = useState<GlobalSignalState>({
    isActive: false,
    tokensEarned: 0,
    maxTokens: 10,
    timeRemaining: 0,
    nextResetTime: "",
    canCatch: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [timeUntilReset, setTimeUntilReset] = useState("")

  useEffect(() => {
    if (isConnected && publicKey) {
      fetchSignalState()
      // Check for signals every 30 seconds
      const interval = setInterval(checkForSignals, 30000)
      return () => clearInterval(interval)
    }
  }, [isConnected, publicKey])

  useEffect(() => {
    const interval = setInterval(updateTimeUntilReset, 1000)
    return () => clearInterval(interval)
  }, [signalState.nextResetTime])

  const fetchSignalState = async () => {
    if (!publicKey) return

    try {
      const response = await fetch(`/api/signal-hunt/daily-limit?wallet=${publicKey}`)
      if (response.ok) {
        const data = await response.json()
        setSignalState((prev) => ({
          ...prev,
          tokensEarned: data.tokensEarned,
          maxTokens: data.maxTokensPerWindow,
          canCatch: data.canEarn,
          nextResetTime: data.nextResetTime,
        }))
      }
    } catch (error) {
      console.error("Error fetching signal state:", error)
    }
  }

  const checkForSignals = () => {
    if (!signalState.canCatch || signalState.isActive) return

    // 10% chance of signal appearing every 30 seconds
    if (Math.random() < 0.1) {
      activateSignal()
    }
  }

  const activateSignal = () => {
    setSignalState((prev) => ({
      ...prev,
      isActive: true,
      timeRemaining: 10, // 10 seconds to catch
    }))

    // Start countdown
    const countdown = setInterval(() => {
      setSignalState((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(countdown)
          return {
            ...prev,
            isActive: false,
            timeRemaining: 0,
          }
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }
      })
    }, 1000)
  }

  const catchSignal = async () => {
    if (!publicKey || !signalState.isActive || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/game-rewards/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey,
          activityType: "signal_catch",
          amount: 1,
        }),
      })

      if (response.ok) {
        setSignalState((prev) => ({
          ...prev,
          isActive: false,
          timeRemaining: 0,
          tokensEarned: prev.tokensEarned + 1,
          canCatch: prev.tokensEarned + 1 < prev.maxTokens,
        }))

        // Show success feedback
        console.log("Signal caught! Earned 1 token")
      } else {
        const error = await response.json()
        console.error("Failed to catch signal:", error.error)
      }
    } catch (error) {
      console.error("Error catching signal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTimeUntilReset = () => {
    if (!signalState.nextResetTime) return

    const now = new Date().getTime()
    const resetTime = new Date(signalState.nextResetTime).getTime()
    const diff = resetTime - now

    if (diff <= 0) {
      setTimeUntilReset("Resetting...")
      fetchSignalState() // Refresh state when reset time is reached
      return
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (hours > 0) {
      setTimeUntilReset(`${hours}h ${minutes}m`)
    } else if (minutes > 0) {
      setTimeUntilReset(`${minutes}m ${seconds}s`)
    } else {
      setTimeUntilReset(`${seconds}s`)
    }
  }

  if (!isConnected || !publicKey) {
    return (
      <Card>
        
        
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden">
      {signalState.isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse" />
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Global Signal Catcher</CardTitle>
          </div>
          <Badge variant={signalState.canCatch ? "default" : "secondary"}>
            {signalState.canCatch ? "Active" : "Limit Reached"}
          </Badge>
        </div>
        <CardDescription>
          Catch signals that randomly appear across the network. Limited to {signalState.maxTokens} tokens per 2-hour
          window.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tokens Caught</span>
            <span>
              {signalState.tokensEarned}/{signalState.maxTokens}
            </span>
          </div>
          <Progress value={(signalState.tokensEarned / signalState.maxTokens) * 100} className="h-2" />
        </div>

        {/* Reset Timer */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Next Reset</span>
          </div>
          <span className="font-mono">{timeUntilReset}</span>
        </div>

        {/* Signal Catcher */}
        <div className="text-center space-y-4">
          {signalState.isActive ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-green-500 animate-pulse" />
                <span className="text-lg font-semibold text-green-500">Signal Detected!</span>
              </div>

              <div className="text-2xl font-mono font-bold text-red-500">{signalState.timeRemaining}s</div>

              <Button
                onClick={catchSignal}
                disabled={isLoading || !signalState.canCatch}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isLoading ? "Catching..." : "CATCH SIGNAL"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-muted-foreground">Scanning for signals...</span>
              </div>

              <p className="text-sm text-muted-foreground">
                {signalState.canCatch
                  ? "Signals appear randomly. Stay alert!"
                  : `Token limit reached. Resets in ${timeUntilReset}`}
              </p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1">
            <li>• Signals appear randomly every 30 seconds (10% chance)</li>
            <li>• You have 10 seconds to catch each signal</li>
            <li>• Each caught signal earns 1 HOLLOWVOX token</li>
            <li>• Limited to {signalState.maxTokens} tokens per 2-hour window</li>
            <li>• Works on any page across the HOLLOWVOX site</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
