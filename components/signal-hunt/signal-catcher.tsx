"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Radio, Satellite, Zap } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"

interface FloatingSignal {
  id: string
  x: number
  y: number
  createdAt: number
  caught: boolean
}

interface SignalCatcherProps {
  onTokenEarned: (amount: number) => void
  isActive: boolean
}

export function SignalCatcher({ onTokenEarned, isActive }: SignalCatcherProps) {
  const { isConnected, publicKey } = useWallet()
  const [signals, setSignals] = useState<FloatingSignal[]>([])
  const [isHunting, setIsHunting] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [catchRadius] = useState(50) // Radius for catching signals
  const intervalRef = useRef<NodeJS.Timeout>()
  const signalTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    if (isActive && isHunting) {
      document.addEventListener("mousemove", handleMouseMove)
      document.body.style.cursor = "none" // Hide default cursor
    } else {
      document.body.style.cursor = "auto" // Restore default cursor
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.body.style.cursor = "auto"
    }
  }, [isActive, isHunting])

  // Spawn signals every 10 seconds
  useEffect(() => {
    if (!isActive) return

    const spawnSignal = () => {
      const signal: FloatingSignal = {
        id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        x: Math.random() * (window.innerWidth - 100) + 50,
        y: Math.random() * (window.innerHeight - 100) + 50,
        createdAt: Date.now(),
        caught: false,
      }

      setSignals((prev) => [...prev, signal])
      setIsHunting(true)

      // Remove signal after 5 seconds if not caught
      const timeout = setTimeout(() => {
        setSignals((prev) => prev.filter((s) => s.id !== signal.id))
        signalTimeoutRefs.current.delete(signal.id)

        // Check if this was the last signal
        setSignals((current) => {
          if (current.length <= 1) {
            setIsHunting(false)
          }
          return current.filter((s) => s.id !== signal.id)
        })
      }, 5000)

      signalTimeoutRefs.current.set(signal.id, timeout)
    }

    // Spawn first signal after 3 seconds, then every 10 seconds
    const initialTimeout = setTimeout(spawnSignal, 3000)
    intervalRef.current = setInterval(spawnSignal, 10000)

    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      signalTimeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
      signalTimeoutRefs.current.clear()
    }
  }, [isActive])

  // Check for signal catches
  useEffect(() => {
    if (!isHunting) return

    const checkCatch = () => {
      signals.forEach((signal) => {
        if (signal.caught) return

        const distance = Math.sqrt(Math.pow(mousePosition.x - signal.x, 2) + Math.pow(mousePosition.y - signal.y, 2))

        if (distance <= catchRadius) {
          catchSignal(signal.id)
        }
      })
    }

    const animationFrame = requestAnimationFrame(checkCatch)
    return () => cancelAnimationFrame(animationFrame)
  }, [mousePosition, signals, isHunting, catchRadius])

  const catchSignal = useCallback(
    async (signalId: string) => {
      // Mark signal as caught
      setSignals((prev) => prev.map((s) => (s.id === signalId ? { ...s, caught: true } : s)))

      // Clear timeout for this signal
      const timeout = signalTimeoutRefs.current.get(signalId)
      if (timeout) {
        clearTimeout(timeout)
        signalTimeoutRefs.current.delete(signalId)
      }

      // Award token if user is connected
      if (isConnected && publicKey) {
        try {
          const response = await fetch("/api/game-rewards/earn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: publicKey,
              gameType: "signal-catcher",
              tokensEarned: 1,
              sessionId: signalId,
              metadata: {
                signalId,
                catchTime: Date.now(),
                mousePosition,
              },
            }),
          })

          if (response.ok) {
            onTokenEarned(1)
          }
        } catch (error) {
          console.error("Error awarding catch token:", error)
        }
      }

      // Remove signal after catch animation
      setTimeout(() => {
        setSignals((prev) => {
          const newSignals = prev.filter((s) => s.id !== signalId)
          if (newSignals.length === 0) {
            setIsHunting(false)
          }
          return newSignals
        })
      }, 1000)
    },
    [isConnected, publicKey, onTokenEarned, mousePosition],
  )

  if (!isActive) return null

  return (
    <>
      {/* Floating Signals */}
      {signals.map((signal) => (
        <div
          key={signal.id}
          className={`fixed pointer-events-none z-50 transition-all duration-1000 ${
            signal.caught ? "scale-150 opacity-0" : "scale-100 opacity-100"
          }`}
          style={{
            left: signal.x - 20,
            top: signal.y - 20,
            transform: signal.caught ? "scale(1.5)" : "scale(1)",
          }}
        >
          <div className="relative">
            {/* Signal glow effect */}
            <div className="absolute inset-0 animate-pulse">
              <div className="w-10 h-10 bg-primary/30 rounded-full blur-md"></div>
            </div>

            {/* Signal icon */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <Radio className={`h-6 w-6 text-primary animate-bounce ${signal.caught ? "text-green-400" : ""}`} />

              {/* Catch effect */}
              {signal.caught && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-green-400 animate-ping" />
                </div>
              )}
            </div>

            {/* Signal waves animation */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-10 h-10 border-2 border-primary/50 rounded-full animate-ping"></div>
              <div
                className="absolute inset-0 w-10 h-10 border-2 border-primary/30 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>
          </div>
        </div>
      ))}

      {/* Custom Satellite Cursor */}
      {isHunting && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-75"
          style={{
            left: mousePosition.x - 16,
            top: mousePosition.y - 16,
          }}
        >
          <div className="relative">
            {/* Satellite icon */}
            <Satellite className="h-8 w-8 text-primary drop-shadow-lg" />

            {/* Scanning radius indicator */}
            <div
              className="absolute border-2 border-primary/30 rounded-full pointer-events-none"
              style={{
                width: catchRadius * 2,
                height: catchRadius * 2,
                left: 16 - catchRadius,
                top: 16 - catchRadius,
                animation: "pulse 2s infinite",
              }}
            ></div>

            {/* Scanning beam effect */}
            <div className="absolute inset-0 animate-spin">
              <div className="w-1 h-6 bg-primary/50 absolute left-1/2 top-0 transform -translate-x-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay when hunting */}
      {isHunting && signals.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-primary/30">
          <div className="flex items-center gap-2 text-primary">
            <Satellite className="h-4 w-4 animate-pulse" />
            <span className="font-orbitron text-sm">Signal detected! Move satellite to catch it!</span>
            <Radio className="h-4 w-4 animate-bounce" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </>
  )
}
