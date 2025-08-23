"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Wallet, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// HOLLOWVOX token configuration
const HVX_ASSET_CODE = "HOLLOWVOX"
const HVX_ISSUER_ADDRESSES = [
  {
    address: "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    name: "HOLLOWVOX-1",
    color: "#00ff76",
  },
  {
    address: "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
    name: "HOLLOWVOX-2",
    color: "#ff6b00",
  },
]

const HORIZON_URL = "https://horizon.stellar.org"

const TIERS = [
  { level: 1, name: "Tier 1", minBalance: 1_000_000 },
  { level: 2, name: "Tier 2", minBalance: 10_000_000 },
  { level: 3, name: "Tier 3", minBalance: 50_000_000 },
]

interface TokenBalance {
  issuer: string
  name: string
  balance: number
  color: string
}

interface BalanceResult {
  publicKey: string
  tokenBalances: TokenBalance[]
  totalBalance: number
  tier: string
  tierLevel: number
  accountExists: boolean
}

export function BalanceChecker() {
  const [publicKey, setPublicKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<BalanceResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isValidStellarAddress = (address: string): boolean => {
    // Basic Stellar public key validation
    return /^G[A-Z2-7]{55}$/.test(address)
  }

  const checkBalance = async () => {
    if (!publicKey.trim()) {
      setError("Please enter a public key")
      return
    }

    if (!isValidStellarAddress(publicKey.trim())) {
      setError("Invalid Stellar public key format")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Fetch account data from Stellar Horizon
      const response = await fetch(`${HORIZON_URL}/accounts/${publicKey.trim()}`)

      if (!response.ok) {
        if (response.status === 404) {
          // Account not found (unfunded account)
          setResult({
            publicKey: publicKey.trim(),
            tokenBalances: HVX_ISSUER_ADDRESSES.map((issuer) => ({
              issuer: issuer.address,
              name: issuer.name,
              balance: 0,
              color: issuer.color,
            })),
            totalBalance: 0,
            tier: "No Tier",
            tierLevel: 0,
            accountExists: false,
          })
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const account = await response.json()

      // Find all balances that match the HOLLOWVOX asset code and any of the recognized issuers
      const tokenBalances: TokenBalance[] = HVX_ISSUER_ADDRESSES.map((issuer) => {
        const balanceLine = account.balances?.find(
          (balance: any) =>
            balance.asset_type !== "native" &&
            balance.asset_code === HVX_ASSET_CODE &&
            balance.asset_issuer === issuer.address,
        )

        return {
          issuer: issuer.address,
          name: issuer.name,
          balance: balanceLine ? Number.parseFloat(balanceLine.balance || "0") : 0,
          color: issuer.color,
        }
      })

      // Calculate total balance across all issuers
      const totalBalance = tokenBalances.reduce((sum, token) => sum + token.balance, 0)

      // Determine tier
      const currentTier = [...TIERS].reverse().find((t) => totalBalance >= t.minBalance)

      setResult({
        publicKey: publicKey.trim(),
        tokenBalances,
        totalBalance,
        tier: currentTier ? currentTier.name : "No Tier",
        tierLevel: currentTier ? currentTier.level : 0,
        accountExists: true,
      })
    } catch (err) {
      console.error("Error checking balance:", err)
      setError(err instanceof Error ? err.message : "Failed to check balance")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkBalance()
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          HOLLOWVOX Balance Checker
        </CardTitle>
        <CardDescription>
          Enter any Stellar public key to check HOLLOWVOX token balances and Hollower tier status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publicKey">Stellar Public Key</Label>
            <div className="flex gap-2">
              <Input
                id="publicKey"
                type="text"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="font-mono text-sm"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !publicKey.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </form>

        {error && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-muted/20 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Account</p>
                <p className="font-mono text-sm break-all">
                  <span className="sm:hidden">{result.publicKey}</span>
                  <span className="hidden sm:inline">
                    {result.publicKey.slice(0, 8)}...{result.publicKey.slice(-8)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={result.tierLevel > 0 ? "border-primary text-primary" : ""}>
                  {result.tier}
                </Badge>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <a
                    href={`https://stellar.expert/explorer/public/account/${result.publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on StellarExpert"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {!result.accountExists && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertDescription className="text-amber-200">
                  This account has not been activated on the Stellar network yet. It needs to be funded with XLM to hold
                  tokens.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Token Balances</h4>
                {result.tokenBalances.map((token) => (
                  <div key={token.issuer} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" style={{ borderColor: token.color, color: token.color }}>
                        {token.name}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {token.issuer.slice(0, 8)}...{token.issuer.slice(-8)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{token.balance.toLocaleString()} HOLLOWVOX</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total HOLLOWVOX Balance</span>
                  <span className="font-bold text-lg">{result.totalBalance.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Hollower Tier</span>
                  <Badge variant="outline" className={result.tierLevel > 0 ? "border-primary text-primary" : ""}>
                    {result.tier}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
