"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Music, Target, Zap, X, Play } from "lucide-react"

interface FoundSignal {
  id: string
  type: "rhythm" | "lore" | "token" | "rare"
  title: string
  description: string
  reward: number
  completed: boolean
  timestamp: string
  x: number
  y: number
}

interface RhythmGameProps {
  signal: FoundSignal
  onComplete: (score: number, perfect: boolean) => void
  onCancel: () => void
  audioEnabled: boolean
}

interface Beat {
  id: string
  time: number
  lane: number
  hit: boolean
  perfect: boolean
}

export function RhythmGame({ signal, onComplete, onCancel, audioEnabled }: RhythmGameProps) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "finished">("ready")
  const [beats, setBeats] = useState<Beat[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [perfectHits, setPerfectHits] = useState(0)
  const [totalBeats, setTotalBeats] = useState(0)
  const [gameProgress, setGameProgress] = useState(0)

  const gameRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const gameDuration = 20000 // 20 seconds

  useEffect(() => {
    generateBeats()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const generateBeats = () => {
    const newBeats: Beat[] = []
    const beatInterval = 500 // Beat every 500ms
    const lanes = 4

    for (let time = 2000; time < gameDuration - 1000; time += beatInterval) {
      // Add some variation to make it interesting
      if (Math.random() > 0.3) {
        // 70% chance of beat
        const lane = Math.floor(Math.random() * lanes)
        newBeats.push({
          id: `beat-${time}-${lane}`,
          time,
          lane,
          hit: false,
          perfect: false,
        })
      }
    }

    setBeats(newBeats)
    setTotalBeats(newBeats.length)
  }

  const startGame = () => {
    setGameState("playing")
    startTimeRef.current = Date.now()

    if (audioRef.current && audioEnabled) {
      audioRef.current.play()
    }

    const gameLoop = () => {
      const elapsed = Date.now() - startTimeRef.current
      setCurrentTime(elapsed)
      setGameProgress((elapsed / gameDuration) * 100)

      if (elapsed >= gameDuration) {
        endGame()
        return
      }

      animationRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoop()
  }

  const endGame = () => {
    setGameState("finished")
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    // Calculate final score and check if perfect
    const hitBeats = beats.filter((beat) => beat.hit).length
    const accuracy = totalBeats > 0 ? (hitBeats / totalBeats) * 100 : 0
    const finalScore = Math.floor(score * (accuracy / 100))
    const isPerfect = perfectHits === totalBeats && totalBeats > 0

    setTimeout(() => {
      onComplete(finalScore, isPerfect)
    }, 2000)
  }

  const hitBeat = (lane: number) => {
    const hitWindow = 200 // 200ms hit window
    const currentBeats = beats.filter(
      (beat) => beat.lane === lane && !beat.hit && Math.abs(beat.time - currentTime) <= hitWindow,
    )

    if (currentBeats.length > 0) {
      const closestBeat = currentBeats.reduce((closest, beat) =>
        Math.abs(beat.time - currentTime) < Math.abs(closest.time - currentTime) ? beat : closest,
      )

      const timeDiff = Math.abs(closestBeat.time - currentTime)
      const isPerfect = timeDiff <= 50 // Perfect within 50ms

      setBeats((prev) =>
        prev.map((beat) => (beat.id === closestBeat.id ? { ...beat, hit: true, perfect: isPerfect } : beat)),
      )

      const points = isPerfect ? 100 : 50
      setScore((prev) => prev + points * (combo + 1))
      setCombo((prev) => {
        const newCombo = prev + 1
        setMaxCombo((current) => Math.max(current, newCombo))
        return newCombo
      })

      if (isPerfect) {
        setPerfectHits((prev) => prev + 1)
      }
    } else {
      // Miss - reset combo
      setCombo(0)
    }
  }

  const getBeatPosition = (beat: Beat) => {
    const progress = (currentTime - beat.time + 2000) / 2000 // 2 second travel time
    return Math.max(0, Math.min(100, progress * 100))
  }

  const getSignalTheme = () => {
    switch (signal.type) {
      case "rhythm":
        return {
          color: "#a855f7",
          bgColor: "bg-purple-500/10",
          borderColor: "border-purple-500/20",
        }
      case "lore":
        return {
          color: "#3b82f6",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
        }
      case "token":
        return {
          color: "#eab308",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
        }
      case "rare":
        return {
          color: "#ef4444",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
        }
      default:
        return {
          color: "#00ff76",
          bgColor: "bg-primary/10",
          borderColor: "border-primary/20",
        }
    }
  }

  const theme = getSignalTheme()

  return (
    <Card className={`bg-card/50 backdrop-blur-sm ${theme.borderColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-orbitron text-xl flex items-center gap-2">
              <Music className="h-5 w-5" style={{ color: theme.color }} />
              {signal.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{signal.description}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {gameState === "ready" && (
          <div className="text-center space-y-4">
            <div className={`p-8 rounded-lg ${theme.bgColor}`}>
              <Music className="h-16 w-16 mx-auto mb-4" style={{ color: theme.color }} />
              <h3 className="font-orbitron text-2xl font-bold mb-2">Signal Decoded</h3>
              <p className="text-muted-foreground mb-4">
                Prepare to synchronize with the interdimensional rhythm pattern.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Duration</div>
                  <div className="text-muted-foreground">20 seconds</div>
                </div>
                <div>
                  <div className="font-semibold">Reward</div>
                  <div style={{ color: theme.color }}>+{signal.reward} HVX</div>
                </div>
              </div>
            </div>
            <Button onClick={startGame} size="lg" className="font-bold">
              <Play className="h-4 w-4 mr-2" />
              Begin Synchronization
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: theme.color }}>
                  {score}
                </div>
                <div className="text-xs text-muted-foreground">SCORE</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{combo}</div>
                <div className="text-xs text-muted-foreground">COMBO</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{perfectHits}</div>
                <div className="text-xs text-muted-foreground">PERFECT</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{Math.ceil((gameDuration - currentTime) / 1000)}</div>
                <div className="text-xs text-muted-foreground">TIME</div>
              </div>
            </div>

            {/* Progress Bar */}
            <Progress value={gameProgress} className="h-2" />

            {/* Game Area */}
            <div
              ref={gameRef}
              className="relative h-96 bg-black/50 rounded-lg border-2 overflow-hidden"
              style={{ borderColor: theme.color }}
            >
              {/* Lanes */}
              {[0, 1, 2, 3].map((lane) => (
                <div
                  key={lane}
                  className="absolute h-full border-r border-white/20"
                  style={{
                    left: `${(lane / 4) * 100}%`,
                    width: "25%",
                  }}
                >
                  {/* Hit Zone */}
                  <div
                    className="absolute bottom-0 h-16 w-full border-2 rounded-t-lg opacity-50"
                    style={{ borderColor: theme.color, backgroundColor: theme.color + "20" }}
                  />

                  {/* Hit Button */}
                  <Button
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full p-0"
                    style={{ backgroundColor: theme.color }}
                    onClick={() => hitBeat(lane)}
                  >
                    <Target className="h-6 w-6" />
                  </Button>
                </div>
              ))}

              {/* Beats */}
              {beats.map((beat) => {
                const position = getBeatPosition(beat)
                if (position < 0 || position > 100 || beat.hit) return null

                return (
                  <div
                    key={beat.id}
                    className="absolute w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-100"
                    style={{
                      left: `${(beat.lane / 4) * 100 + 12.5 - 3}%`,
                      top: `${100 - position}%`,
                      borderColor: theme.color,
                      backgroundColor: theme.color + "40",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color }} />
                  </div>
                )
              })}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Hit the targets when the beats reach the bottom zone!</p>
              <p>Perfect timing gives bonus points and maintains your combo.</p>
            </div>
          </div>
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-4">
            <div className={`p-8 rounded-lg ${theme.bgColor}`}>
              <Zap className="h-16 w-16 mx-auto mb-4" style={{ color: theme.color }} />
              <h3 className="font-orbitron text-2xl font-bold mb-4">Signal Synchronized!</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: theme.color }}>
                    {score}
                  </div>
                  <div className="text-sm text-muted-foreground">Final Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">{maxCombo}</div>
                  <div className="text-sm text-muted-foreground">Max Combo</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{perfectHits}</div>
                  <div className="text-sm text-muted-foreground">Perfect Hits</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {totalBeats > 0 ? Math.round((beats.filter((b) => b.hit).length / totalBeats) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </div>
              </div>

              {perfectHits === totalBeats && totalBeats > 0 && (
                <Badge className="mb-4" style={{ backgroundColor: theme.color }}>
                  PERFECT SYNCHRONIZATION!
                </Badge>
              )}

              <p className="text-muted-foreground">Returning to signal map in a moment...</p>
            </div>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} loop={false} className="hidden">
          <source src={`/audio/signal-${signal.type}.mp3`} type="audio/mpeg" />
        </audio>
      </CardContent>
    </Card>
  )
}
