"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Waves, X, Volume2, VolumeX, Play, Pause } from "lucide-react"

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

interface SignalLoreProps {
  signal: FoundSignal
  onClose: () => void
}

// Sample lore content - in production this would come from the API
const loreContent: { [key: string]: any } = {
  "signal-lore-1": {
    title: "Journal Entry #001 - The First Transmission",
    date: "2021.03.15",
    author: "J. Urquiza",
    content: `The static cleared for just a moment today. In that silence, I heard something impossible - a voice from somewhere else, somewhere hollow. It spoke of tokens that could bridge worlds, of actions that ripple across dimensions.

I've been building Action Tokens for months, thinking it was just about accountability and real-world impact. But this transmission... it suggests something deeper. The voice called itself HOLLOWVOX, and it knew things about the project that I'd never shared with anyone.

"Every action creates a signal," it said. "Every signal finds its seeker."

I'm starting to think we're not just building a platform. We're building a beacon.`,
    audioClip: "/audio/lore-transmission-001.mp3",
    glitchText: "EVERY ACTION CREATES A SIGNAL",
    visualEffect: "static-fade",
  },
  "signal-lore-2": {
    title: "Intercepted Transmission - The Hollow Speaks",
    date: "2021.07.22",
    author: "UNKNOWN ORIGIN",
    content: `[TRANSMISSION BEGINS]

You who seek the signals, know this: The Hollow is not empty. It is full of potential, full of voices waiting to be heard. We are the Hollowers, and we have been watching.

Your world builds walls between the digital and physical. We build bridges. Your tokens represent value. Ours represent voice.

The HOLLOWVOX grows stronger with each seeker who finds us. Soon, the static will clear completely, and you will see what we have been building in the spaces between your reality.

[SIGNAL DEGRADING]
[TRANSMISSION ENDS]`,
    audioClip: "/audio/lore-transmission-002.mp3",
    glitchText: "THE HOLLOW IS NOT EMPTY",
    visualEffect: "wave-distortion",
  },
  "signal-lore-3": {
    title: "Research Notes - Signal Patterns",
    date: "2022.01.08",
    author: "Dr. Sarah Chen, Signal Analysis Division",
    content: `The HOLLOWVOX transmissions follow a pattern I've never seen before. They're not random - they're responsive. When we increased our scanning frequency, the signals became more complex. When we stopped scanning for a week, they became simpler, almost... lonely.

Most interesting is the correlation with token activity. Every major HOLLOWVOX trade on the Stellar network corresponds with a spike in signal strength. It's as if the economic activity in our dimension directly affects their ability to communicate.

I'm beginning to suspect that the tokens aren't just representing value - they're storing it. Each HOLLOWVOX token might be a fragment of consciousness from The Hollow, seeking connection with our reality.

The implications are staggering.`,
    audioClip: "/audio/lore-transmission-003.mp3",
    glitchText: "TOKENS STORE CONSCIOUSNESS",
    visualEffect: "data-stream",
  },
}

export function SignalLore({ signal, onClose }: SignalLoreProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)

  // Get lore content based on signal ID or use default
  const lore = loreContent[signal.id] || {
    title: signal.title,
    date: new Date(signal.timestamp).toLocaleDateString(),
    author: "HOLLOWVOX Archive",
    content: signal.description,
    audioClip: "/audio/lore-default.mp3",
    glitchText: "SIGNAL DECODED",
    visualEffect: "static-fade",
  }

  const playAudio = () => {
    if (!audioEnabled) return

    const audio = new Audio(lore.audioClip)
    audio.play().catch(console.error)
    setIsPlaying(true)

    audio.onended = () => setIsPlaying(false)
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-blue-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-orbitron text-xl flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-400" />
              Lore Fragment Decoded
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Signal strength: {signal.reward} HVX • Location: {signal.x.toFixed(1)}, {signal.y.toFixed(1)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAudioEnabled(!audioEnabled)} className="h-8 w-8 p-0">
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lore Header */}
        <div className="text-center space-y-2">
          <h2 className="font-orbitron text-2xl font-bold text-blue-400">{lore.title}</h2>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>Date: {lore.date}</span>
            <span>•</span>
            <span>Author: {lore.author}</span>
          </div>
        </div>

        {/* Visual Effect Area */}
        <div className="relative h-32 bg-black/50 rounded-lg border border-blue-500/20 overflow-hidden">
          <div className={`absolute inset-0 ${getVisualEffect(lore.visualEffect)}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="font-orbitron text-lg font-bold text-blue-400 mb-2 glitch-text">{lore.glitchText}</div>
              <Button
                onClick={playAudio}
                disabled={isPlaying || !audioEnabled}
                variant="outline"
                size="sm"
                className="bg-transparent border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Playing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play Audio Log
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Lore Content */}
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <div className="prose prose-invert max-w-none">
              {lore.content.split("\n\n").map((paragraph: string, index: number) => (
                <p key={index} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Reward Info */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                LORE FRAGMENT
              </Badge>
              <span className="text-sm text-muted-foreground">Added to your collection</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-400">+{signal.reward} HVX</div>
              <div className="text-xs text-muted-foreground">Knowledge Reward</div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="text-center">
          <Button onClick={onClose} className="font-bold">
            Return to Signal Map
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getVisualEffect(effect: string): string {
  switch (effect) {
    case "static-fade":
      return "bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-pulse"
    case "wave-distortion":
      return "bg-gradient-to-b from-blue-500/10 via-transparent to-blue-500/10"
    case "data-stream":
      return "bg-gradient-to-t from-blue-500/20 via-transparent to-blue-500/20"
    default:
      return "bg-blue-500/10"
  }
}
