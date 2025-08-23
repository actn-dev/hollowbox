"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Radio, Zap, Music, Waves, Target, Signal } from "lucide-react"

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

interface SignalMapProps {
  onScan: (x: number, y: number) => void
  foundSignals: FoundSignal[]
  canScan: boolean
  isScanning: boolean
  audioEnabled: boolean
}

export function SignalMap({ onScan, foundSignals, canScan, isScanning, audioEnabled }: SignalMapProps) {
  const [scanPosition, setScanPosition] = useState<{ x: number; y: number } | null>(null)
  const [staticPattern, setStaticPattern] = useState<number[][]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    generateStaticPattern()
    startAnimation()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const generateStaticPattern = () => {
    const pattern: number[][] = []
    for (let i = 0; i < 50; i++) {
      const row: number[] = []
      for (let j = 0; j < 50; j++) {
        row.push(Math.random())
      }
      pattern.push(row)
    }
    setStaticPattern(pattern)
  }

  const startAnimation = () => {
    const animate = () => {
      generateStaticPattern()
      drawCanvas()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)

    // Draw static background
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 50
      const signal = Math.sin(Date.now() * 0.001 + i * 0.01) * 20
      const value = Math.floor(noise + signal + 30)

      data[i] = value // Red
      data[i + 1] = value * 0.8 // Green
      data[i + 2] = value * 1.2 // Blue
      data[i + 3] = 255 // Alpha
    }

    ctx.putImageData(imageData, 0, 0)

    // Draw signal hotspots (invisible to player but affect probability)
    ctx.globalAlpha = 0.1
    ctx.fillStyle = "#00ff76"

    // Create some hotspot areas
    const hotspots = [
      { x: width * 0.2, y: height * 0.3, radius: 80 },
      { x: width * 0.7, y: height * 0.6, radius: 60 },
      { x: width * 0.5, y: height * 0.8, radius: 70 },
      { x: width * 0.8, y: height * 0.2, radius: 50 },
    ]

    hotspots.forEach((spot) => {
      ctx.beginPath()
      ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.globalAlpha = 1

    // Draw found signals
    foundSignals.forEach((signal) => {
      const x = (signal.x / 100) * width
      const y = (signal.y / 100) * height

      ctx.save()
      ctx.globalAlpha = signal.completed ? 0.5 : 1

      // Signal glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20)
      gradient.addColorStop(0, getSignalColor(signal.type))
      gradient.addColorStop(1, "transparent")

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, 20, 0, Math.PI * 2)
      ctx.fill()

      // Signal center
      ctx.fillStyle = getSignalColor(signal.type)
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    })

    // Draw scan position
    if (scanPosition) {
      const x = (scanPosition.x / 100) * width
      const y = (scanPosition.y / 100) * height

      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.arc(x, y, 30, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  const getSignalColor = (type: string) => {
    switch (type) {
      case "rhythm":
        return "#a855f7" // Purple
      case "lore":
        return "#3b82f6" // Blue
      case "token":
        return "#eab308" // Yellow
      case "rare":
        return "#ef4444" // Red
      default:
        return "#00ff76" // Primary green
    }
  }

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "rhythm":
        return Music
      case "lore":
        return Waves
      case "token":
        return Zap
      case "rare":
        return Target
      default:
        return Signal
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canScan || isScanning) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setScanPosition({ x, y })
    onScan(x, y)

    // Clear scan position after animation
    setTimeout(() => setScanPosition(null), 2000)
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-orbitron text-xl flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Signal Detection Array
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={canScan ? "border-green-500 text-green-400" : "border-red-500 text-red-400"}
            >
              {canScan ? "READY" : "EXHAUSTED"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signal Map Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-[400px] sm:h-[500px] border border-primary/20 rounded-lg cursor-crosshair bg-black"
            onClick={handleCanvasClick}
            style={{
              cursor: canScan && !isScanning ? "crosshair" : "not-allowed",
              filter: "contrast(1.2) brightness(0.9)",
            }}
          />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center">
                <Radio className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-primary font-orbitron text-lg">SCANNING FOR SIGNALS...</p>
                <div className="mt-2 flex justify-center">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions overlay */}
          {!canScan && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
              <div className="text-center">
                <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-orbitron text-lg">DAILY SCANS EXHAUSTED</p>
                <p className="text-sm text-muted-foreground mt-2">Scans reset at midnight UTC</p>
              </div>
            </div>
          )}
        </div>

        {/* Found Signals List */}
        {foundSignals.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-orbitron text-lg font-bold">Detected Signals</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {foundSignals.map((signal) => {
                const IconComponent = getSignalIcon(signal.type)
                return (
                  <div
                    key={signal.id}
                    className={`p-3 rounded-lg border ${
                      signal.completed ? "bg-muted/20 border-muted" : "bg-card/50 border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className="h-4 w-4" style={{ color: getSignalColor(signal.type) }} />
                      <span className="font-semibold text-sm">{signal.title}</span>
                      {signal.completed && (
                        <Badge variant="outline" className="text-xs">
                          DECODED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{signal.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {signal.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-mono text-primary">+{signal.reward} HVX</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Click anywhere on the signal map to scan for interdimensional transmissions.</p>
          <p>Different areas may have varying signal probabilities. Listen carefully...</p>
        </div>
      </CardContent>
    </Card>
  )
}
