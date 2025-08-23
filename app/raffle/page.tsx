"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@/contexts/wallet-context"
import { Gift, Mail, Wallet, Calendar, Trophy, Star, Info } from "lucide-react"

interface RaffleEntry {
  id: string
  method: "wallet" | "email"
  identifier: string
  entries: number
  timestamp: string
}

// Mock current raffle data
const currentRaffle = {
  id: "raffle-2025-01",
  title: "January 2025 Hollower Raffle",
  description: "Win exclusive HOLLOWVOX merchandise, NFTs, and digital art",
  endDate: "2025-01-31T23:59:59Z",
  prizes: [
    { place: "1st", description: "Limited Edition HOLLOWVOX Hoodie + NFT Collection", value: "$150" },
    { place: "2nd", description: "HOLLOWVOX Digital Art Pack + Stickers", value: "$75" },
    { place: "3rd", description: "Exclusive HOLLOWVOX NFT", value: "$50" },
  ],
  totalEntries: 1247,
}

export default function RafflePage() {
  const { isConnected, publicKey, balance, tierLevel } = useWallet()
  const [emailEntry, setEmailEntry] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entryStatus, setEntryStatus] = useState<"none" | "wallet" | "email" | "both">("none")

  const calculateWalletEntries = (balance: number | null): number => {
    if (!balance) return 0
    // 1 entry per 1M HOLLOWVOX tokens held
    return Math.floor(balance / 1_000_000)
  }

  const walletEntries = calculateWalletEntries(balance)
  const daysLeft = Math.ceil((new Date(currentRaffle.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  const handleWalletEntry = async () => {
    if (!isConnected || !publicKey) return

    setIsSubmitting(true)
    try {
      // Simulate API call to enter raffle with wallet
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setEntryStatus(entryStatus === "email" ? "both" : "wallet")
    } catch (error) {
      console.error("Failed to enter raffle:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailEntry.trim()) return

    setIsSubmitting(true)
    try {
      // Simulate API call to enter raffle with email
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setEntryStatus(entryStatus === "wallet" ? "both" : "email")
      setEmailEntry("")
    } catch (error) {
      console.error("Failed to enter raffle:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-12 md:py-16">
      <div className="text-center mb-12">
        <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">Hollower Monthly Raffle</h1>
        <p className="mx-auto max-w-3xl text-muted-foreground">
          Enter our monthly raffle to win exclusive HOLLOWVOX merchandise, NFTs, and digital art. No purchase required -
          just hold HOLLOWVOX tokens or enter for free!
        </p>
      </div>

      {/* Legal Notice */}
      <Alert className="mb-8 border-primary/50 bg-primary/10 max-w-4xl mx-auto">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary-foreground/90">
          <strong>No Purchase Necessary:</strong> This raffle is free to enter. You can participate by holding HOLLOWVOX
          tokens OR by entering with your email address. Holding tokens is not required to win.
        </AlertDescription>
      </Alert>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Current Raffle Info */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  {currentRaffle.title}
                </CardTitle>
                <CardDescription className="mt-2">{currentRaffle.description}</CardDescription>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="border-primary text-primary text-lg px-4 py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  {daysLeft} days left
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentRaffle.prizes.map((prize, index) => (
                <div key={index} className="text-center p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-5 w-5 text-primary mr-2" />
                    <span className="font-bold text-lg">{prize.place} Place</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{prize.description}</p>
                  <Badge variant="outline" className="text-primary border-primary">
                    {prize.value} value
                  </Badge>
                </div>
              ))}
            </div>
            <Separator className="my-6" />
            <div className="text-center">
              <p className="text-muted-foreground">
                Total Entries:{" "}
                <span className="font-bold text-foreground">{currentRaffle.totalEntries.toLocaleString()}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet Entry */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Enter with HOLLOWVOX Holdings
              </CardTitle>
              <CardDescription>
                Connect your wallet to automatically enter based on your HOLLOWVOX token balance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Your Balance</span>
                      <span className="font-bold">{balance?.toLocaleString() || 0} HOLLOWVOX</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Raffle Entries</span>
                      <span className="font-bold text-primary">{walletEntries} entries</span>
                    </div>
                    <div className="text-xs text-muted-foreground">1 entry per 1,000,000 HOLLOWVOX tokens held</div>
                  </div>

                  {walletEntries > 0 ? (
                    <Button
                      onClick={handleWalletEntry}
                      disabled={isSubmitting || entryStatus === "wallet" || entryStatus === "both"}
                      className="w-full"
                    >
                      {entryStatus === "wallet" || entryStatus === "both"
                        ? "✓ Entered with Wallet"
                        : `Enter Raffle (${walletEntries} entries)`}
                    </Button>
                  ) : (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertDescription className="text-amber-200">
                        You need at least 1,000,000 HOLLOWVOX tokens to get wallet-based entries. You can still enter
                        for free using the email option!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Connect your wallet to enter based on your holdings</p>
                  <Button disabled className="w-full">
                    Coming Soon - Wallet Integration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Entry */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Free Entry (No Purchase Required)
              </CardTitle>
              <CardDescription>Enter the raffle for free using your email address</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailEntry} className="space-y-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Free Entries</span>
                    <span className="font-bold text-primary">1 entry</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Everyone gets 1 free entry regardless of token holdings
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={emailEntry}
                    onChange={(e) => setEmailEntry(e.target.value)}
                    required
                    disabled={isSubmitting || entryStatus === "email" || entryStatus === "both"}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || entryStatus === "email" || entryStatus === "both" || !emailEntry.trim()}
                  className="w-full"
                >
                  {entryStatus === "email" || entryStatus === "both"
                    ? "✓ Entered with Email"
                    : "Enter Raffle (1 free entry)"}
                </Button>
              </form>

              <div className="mt-4 text-xs text-muted-foreground">
                <p>
                  By entering, you agree to our{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    Terms of Use
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entry Status */}
        {entryStatus !== "none" && (
          <Card className="bg-green-500/10 border-green-500/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Gift className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="font-orbitron text-xl font-bold text-green-400 mb-2">Successfully Entered!</h3>
                <p className="text-green-200">
                  {entryStatus === "both"
                    ? `You're entered with ${walletEntries + 1} total entries (${walletEntries} from wallet + 1 free entry)`
                    : entryStatus === "wallet"
                      ? `You're entered with ${walletEntries} entries from your wallet holdings`
                      : "You're entered with 1 free entry"}
                </p>
                <p className="text-sm text-green-300 mt-2">
                  Winner will be announced on {new Date(currentRaffle.endDate).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raffle Rules */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-xl">Raffle Rules & Legal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">How to Enter:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Wallet Entry:</strong> Connect your wallet to get 1 entry per 1,000,000 HOLLOWVOX tokens held
                </li>
                <li>
                  <strong>Free Entry:</strong> Enter with your email address for 1 free entry (no purchase required)
                </li>
                <li>You can use both methods to maximize your entries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Legal Compliance:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>No purchase necessary to enter or win</li>
                <li>Void where prohibited by law</li>
                <li>Must be 18+ to participate</li>
                <li>Winners will be selected randomly and notified via email</li>
                <li>Prizes have no cash value and are not transferable</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Winner Selection:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Winners selected randomly at the end of each month</li>
                <li>Results will be posted on this page and social media</li>
                <li>Winners have 30 days to claim their prizes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
