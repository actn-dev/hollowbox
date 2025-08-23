"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Award, Target, Music, Waves, Crown } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  wallet: string
  username?: string
  score: number
  signalsFound: number
  perfectRhythms: number
  loreUnlocked: number
  tokensEarned: number
  lastActive: string
}

export function GameLeaderboard() {
  const [dailyLeaders, setDailyLeaders] = useState<LeaderboardEntry[]>([])
  const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([])
  const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [])

  const fetchLeaderboards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/signal-hunt/leaderboard")
      if (response.ok) {
        const data = await response.json()
        setDailyLeaders(data.daily || [])
        setWeeklyLeaders(data.weekly || [])
        setAllTimeLeaders(data.allTime || [])
      }
    } catch (error) {
      console.error("Error fetching leaderboards:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"
      case 2:
        return "text-gray-400"
      case 3:
        return "text-amber-600"
      default:
        return "text-muted-foreground"
    }
  }

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
  }

  const LeaderboardTable = ({ leaders }: { leaders: LeaderboardEntry[] }) => (
    <div className="space-y-3">
      {leaders.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No seekers have entered the rankings yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Be the first to decode signals and claim your place!</p>
        </div>
      ) : (
        leaders.map((entry) => (
          <div
            key={`${entry.rank}-${entry.wallet}`}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              entry.rank <= 3
                ? "bg-gradient-to-r from-primary/10 to-transparent border-primary/20"
                : "bg-muted/20 border-muted"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getRankIcon(entry.rank)}
                <span className={`font-bold text-lg ${getRankColor(entry.rank)}`}>#{entry.rank}</span>
              </div>
              <div>
                <div className="font-semibold">{entry.username || formatWallet(entry.wallet)}</div>
                <div className="text-sm text-muted-foreground">
                  Last active: {new Date(entry.lastActive).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <div className="font-bold text-primary">{entry.score.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="font-bold text-green-400">{entry.signalsFound}</div>
                <div className="text-xs text-muted-foreground">Signals</div>
              </div>
              <div>
                <div className="font-bold text-purple-400">{entry.perfectRhythms}</div>
                <div className="text-xs text-muted-foreground">Perfect</div>
              </div>
              <div>
                <div className="font-bold text-yellow-400">{entry.tokensEarned}</div>
                <div className="text-xs text-muted-foreground">HVX</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Seeker Leaderboards
        </CardTitle>
        <CardDescription>Top signal hunters competing for interdimensional supremacy</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex items-center gap-2">
              <Waves className="h-4 w-4" />
              All Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Today's Top Seekers</h3>
                <Badge variant="outline" className="border-primary text-primary">
                  Resets at midnight UTC
                </Badge>
              </div>
              <LeaderboardTable leaders={dailyLeaders} />
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">This Week's Champions</h3>
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  Resets Monday
                </Badge>
              </div>
              <LeaderboardTable leaders={weeklyLeaders} />
            </div>
          </TabsContent>

          <TabsContent value="alltime" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Legendary Seekers</h3>
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  Hall of Fame
                </Badge>
              </div>
              <LeaderboardTable leaders={allTimeLeaders} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Achievement Badges */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold">Achievement Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <Target className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-sm font-semibold">Signal Master</div>
              <div className="text-xs text-muted-foreground">Most signals found</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <Music className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-semibold">Rhythm Legend</div>
              <div className="text-xs text-muted-foreground">Perfect rhythm scores</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <Waves className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-semibold">Lore Keeper</div>
              <div className="text-xs text-muted-foreground">Lore fragments collected</div>
            </div>
            <div className="text-center p-3 bg-muted/20 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-sm font-semibold">Token Hunter</div>
              <div className="text-xs text-muted-foreground">HVX tokens earned</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
