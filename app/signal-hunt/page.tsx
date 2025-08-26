"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Radio,
  Zap,
  Music,
  Clock,
  Volume2,
  VolumeX,
  Target,
  Waves,
  Signal,
  Headphones,
} from "lucide-react";
import { SignalMap } from "@/components/signal-hunt/signal-map";
import { RhythmGame } from "@/components/signal-hunt/rhythm-game";
import { SignalLore } from "@/components/signal-hunt/signal-lore";
import { GameLeaderboard } from "@/components/signal-hunt/game-leaderboard";
import { GlobalSignalCatcher } from "@/components/signal-hunt/global-signal-catcher";
import { useAuth } from "@/hooks/use-auth";

interface GameStats {
  scansUsed: number;
  maxScansPerWindow: number;
  tokensEarned: number;
  signalsFound: number;
  perfectRhythms: number;
  loreUnlocked: number;
  lastScanTime: string;
  nextResetTime: string;
  canScan: boolean;
  windowStart: string;
  windowEnd: string;
}

interface FoundSignal {
  id: string;
  type: "rhythm" | "lore" | "token" | "rare";
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  timestamp: string;
  x: number;
  y: number;
}

export default function SignalHuntPage() {
  const { isConnected, publicKey } = useAuth();
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [foundSignals, setFoundSignals] = useState<FoundSignal[]>([]);
  const [currentSignal, setCurrentSignal] = useState<FoundSignal | null>(null);
  const [gameMode, setGameMode] = useState<"map" | "rhythm" | "lore">("map");
  const [isScanning, setIsScanning] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (publicKey) {
      loadGameData();
      // Refresh data every 30 seconds
      const interval = setInterval(loadGameData, 30000);
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  useEffect(() => {
    const interval = setInterval(updateTimeUntilReset, 1000);
    return () => clearInterval(interval);
  }, [gameStats]);

  const loadGameData = async () => {
    if (!publicKey) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/signal-hunt/scan?wallet=${publicKey}`);
      if (response.ok) {
        const data = await response.json();
        setGameStats({
          scansUsed: data.scansUsed,
          maxScansPerWindow: data.maxScansPerWindow,
          tokensEarned: 0, // Will be updated from other endpoints
          signalsFound: 0,
          perfectRhythms: 0,
          loreUnlocked: 0,
          lastScanTime: "",
          nextResetTime: data.nextResetTime,
          canScan: data.canScan,
          windowStart: data.windowStart,
          windowEnd: data.windowEnd,
        });
      }
    } catch (error) {
      console.error("Error loading game data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeUntilReset = () => {
    if (!gameStats?.nextResetTime) return;

    const now = new Date().getTime();
    const resetTime = new Date(gameStats.nextResetTime).getTime();
    const diff = resetTime - now;

    if (diff <= 0) {
      setTimeUntilReset("Resetting...");
      loadGameData(); // Refresh when reset time is reached
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      setTimeUntilReset(`${hours}h ${minutes}m`);
    } else if (minutes > 0) {
      setTimeUntilReset(`${minutes}m ${seconds}s`);
    } else {
      setTimeUntilReset(`${seconds}s`);
    }
  };

  const performScan = async (x: number, y: number) => {
    if (!gameStats || !gameStats.canScan || isScanning) return;

    setIsScanning(true);

    try {
      const response = await fetch("/api/signal-hunt/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey,
          scanType: "manual",
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update game stats
        setGameStats((prev) =>
          prev
            ? {
                ...prev,
                scansUsed: result.scansUsed,
                canScan: result.canScan,
                nextResetTime: result.nextResetTime,
              }
            : null
        );

        // Handle found signals
        if (result.foundSignals && result.foundSignals.length > 0) {
          const signal = result.foundSignals[0];
          const newSignal: FoundSignal = {
            id: `signal_${Date.now()}`,
            type:
              signal.type === "rare"
                ? "rare"
                : signal.type === "strong"
                ? "token"
                : "rhythm",
            title: `${signal.type.toUpperCase()} Signal`,
            description: `Signal strength: ${signal.strength}% - Tokens: ${signal.tokens}`,
            reward: signal.tokens,
            completed: false,
            timestamp: new Date().toISOString(),
            x,
            y,
          };

          setCurrentSignal(newSignal);
          setFoundSignals((prev) => [...prev, newSignal]);

          if (newSignal.type === "rhythm") {
            setGameMode("rhythm");
          } else if (newSignal.type === "lore") {
            setGameMode("lore");
          }
        }
      } else {
        const error = await response.json();
        console.error("Scan failed:", error.error);
      }
    } catch (error) {
      console.error("Error performing scan:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const completeRhythmGame = async (score: number, perfect: boolean) => {
    if (!currentSignal) return;

    try {
      const response = await fetch("/api/signal-hunt/complete-rhythm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: currentSignal.id,
          score,
          perfect,
          wallet: publicKey,
        }),
      });

      if (response.ok) {
        setFoundSignals((prev) =>
          prev.map((signal) =>
            signal.id === currentSignal.id
              ? { ...signal, completed: true }
              : signal
          )
        );
        setGameMode("map");
        setCurrentSignal(null);
        loadGameData(); // Refresh stats
      }
    } catch (error) {
      console.error("Error completing rhythm game:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 md:py-16">
        <div className="text-center">
          <Radio className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h1 className="font-orbitron text-4xl font-bold mb-4">Signal Hunt</h1>
          <p className="text-muted-foreground">
            Initializing signal detection array...
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected || !publicKey) {
    return (
      <div className="py-12 md:py-16">
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <Radio className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <CardTitle>Signal Hunt</CardTitle>
              <CardDescription>
                Connect your wallet to start hunting for signals across the
                Hollowvox network
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Please connect your wallet to access Signal Hunt features
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <div className="text-center mb-8">
        <Badge
          variant="outline"
          className="border-primary text-primary text-lg px-4 py-2 mb-4"
        >
          <Signal className="h-4 w-4 mr-2" />
          HOLLOWVOX Signal Catcher
        </Badge>
        <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">
          Global Signal Detection
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Catch signals that randomly appear across the HOLLOWVOX network. Stay
          alert and earn tokens!
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <GlobalSignalCatcher />
      </div>

      {/* Game Stats Header */}
      {gameStats && (
        <Card className="bg-card/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-primary mx-auto mb-1" />
                  Seeker Status - 2-Hour Window
                </CardTitle>
                <CardDescription>
                  {isConnected
                    ? `Connected: ${publicKey?.slice(
                        0,
                        8
                      )}...${publicKey?.slice(-8)}`
                    : "Anonymous Seeker"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="h-8 w-8 p-0"
                >
                  {audioEnabled ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <Radio className="h-6 w-6 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">
                  {gameStats.scansUsed}/{gameStats.maxScansPerWindow}
                </div>
                <div className="text-xs text-muted-foreground">
                  2-Hour Scans
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-yellow-400">
                  {gameStats.tokensEarned}
                </div>
                <div className="text-xs text-muted-foreground">
                  Window Tokens
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <Target className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-400">
                  {gameStats.signalsFound}
                </div>
                <div className="text-xs text-muted-foreground">
                  Signals Found
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <Music className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-purple-400">
                  {gameStats.perfectRhythms}
                </div>
                <div className="text-xs text-muted-foreground">
                  Perfect Rhythms
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <Waves className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-400">
                  {gameStats.loreUnlocked}
                </div>
                <div className="text-xs text-muted-foreground">
                  Lore Unlocked
                </div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <Clock className="h-6 w-6 text-orange-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-orange-400">
                  {timeUntilReset}
                </div>
                <div className="text-xs text-muted-foreground">Next Reset</div>
              </div>
            </div>

            {!gameStats.canScan && (
              <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  2-hour window scans exhausted. Scans reset in {timeUntilReset}
                  .{isConnected && " Higher tier Hollowers get bonus scans!"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Game Content */}
      <div className="space-y-8">
        {gameMode === "map" && (
          <SignalMap
            onScan={performScan}
            foundSignals={foundSignals}
            canScan={gameStats?.canScan || false}
            isScanning={isScanning}
            audioEnabled={audioEnabled}
          />
        )}

        {gameMode === "rhythm" && currentSignal && (
          <RhythmGame
            signal={currentSignal}
            onComplete={completeRhythmGame}
            onCancel={() => {
              setGameMode("map");
              setCurrentSignal(null);
            }}
            audioEnabled={audioEnabled}
          />
        )}

        {gameMode === "lore" && currentSignal && (
          <SignalLore
            signal={currentSignal}
            onClose={() => {
              setGameMode("map");
              setCurrentSignal(null);
            }}
          />
        )}

        {/* Leaderboard */}
        <GameLeaderboard />

        {/* How to Play */}
        <Card className="bg-card/50 backdrop-blur-sm mt-8 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">
              How to Play Global Signal Catcher
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" />
                  Signal Detection
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Signals appear randomly every 30 seconds (10% chance)
                  </li>
                  <li>• Works on any page across the HOLLOWVOX site</li>
                  <li>
                    • You have 10 seconds to catch each signal when it appears
                  </li>
                  <li>• Move your mouse to catch floating signals</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Signal className="h-4 w-4 text-yellow-400" />
                  Token Rewards
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Each caught signal earns 1 HOLLOWVOX token</li>
                  <li>• Limited to 10 tokens per 2-hour window</li>
                  <li>
                    • Resets every 2 hours at even times (00:00, 02:00, 04:00,
                    etc.)
                  </li>
                  <li>• Connect your wallet to start earning</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Pro Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep the signal catcher card visible while browsing</li>
                <li>• Listen for audio cues when signals appear</li>
                <li>• The card will pulse and show a countdown when active</li>
                <li>
                  • Check back every 2 hours for fresh token opportunities
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Background Audio */}
      <audio
        ref={audioRef}
        loop
        autoPlay={audioEnabled}
        muted={!audioEnabled}
        className="hidden"
      >
        <source src="/audio/signal-hunt-ambient.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
