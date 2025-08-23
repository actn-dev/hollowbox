"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { Loader2, Wallet, AlertTriangle } from 'lucide-react'

interface WalletConnectModalProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function WalletConnectModal({ isOpen, setIsOpen }: WalletConnectModalProps) {
  const { connect, isLoading, error } = useWallet()
  const [isRabetAvailable, setIsRabetAvailable] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isV0Preview, setIsV0Preview] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== "undefined") {
      setIsV0Preview(
        window.location.hostname.includes("v0.dev") ||
          (window.location.hostname.includes("localhost") && window.parent !== window),
      )
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Only check Rabet since we're not pre-detecting Freighter anymore
    const checkRabet = async () => {
      try {
        if (typeof window !== "undefined" && window.rabet && !isV0Preview) {
          const unlocked = await window.rabet.isUnlocked()
          setIsRabetAvailable(unlocked)
          console.log("Rabet detected, unlocked:", unlocked)
        } else {
          setIsRabetAvailable(false)
        }
      } catch (error) {
        console.log("Rabet check failed:", error)
        setIsRabetAvailable(typeof window !== "undefined" && !!window.rabet && !isV0Preview)
      }
    }

    checkRabet()
    const interval = setInterval(checkRabet, 3000)
    return () => clearInterval(interval)
  }, [isClient, isV0Preview])

  const handleConnect = async (walletType: "freighter" | "rabet") => {
    try {
      await connect(walletType)
      if (!error && !isLoading) {
        setTimeout(() => setIsOpen(false), 500)
      }
    } catch (err) {
      console.error("Connection failed:", err)
    }
  }

  const getRabetStatus = () => {
    if (!isClient) return "Loading..."
    if (typeof window === "undefined") return "Loading..."
    if (isV0Preview) return "Not available in v0 preview"
    if (!window.rabet) return "Not installed"
    return isRabetAvailable ? "Ready to connect" : "Locked - please unlock Rabet"
  }

  const isRabetInstalled = isClient && typeof window !== "undefined" && !!window.rabet && !isV0Preview

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-orbitron">Connect Your Stellar Wallet</DialogTitle>
          <DialogDescription>Choose your preferred Stellar wallet to connect to HOLLOWVOX</DialogDescription>
        </DialogHeader>

        {isV0Preview && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>v0 Preview Mode:</strong> Browser extensions like Freighter and Rabet cannot inject into the embedded preview.
                Click "Open in new tab" or use your deployed domain to connect a wallet.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 py-4">
          {/* Freighter Wallet */}
          <div className="space-y-2">
            <Button
              onClick={() => handleConnect("freighter")}
              disabled={isLoading || isV0Preview}
              className="w-full h-12 text-left justify-start"
              variant="default"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Freighter</div>
                  <div className="text-xs text-muted-foreground">
                    {isV0Preview ? "Not available in embedded preview" : "Click to connect"}
                  </div>
                </div>
              </div>
            </Button>
            <p className="text-xs text-muted-foreground px-2">
              If you don't have Freighter,{" "}
              <a
                href="https://freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                install it here
              </a>
            </p>
          </div>

          {/* Rabet Wallet */}
          <div className="space-y-2">
            <Button
              onClick={() => handleConnect("rabet")}
              disabled={!isRabetInstalled || isLoading || isV0Preview}
              className="w-full h-12 text-left justify-start"
              variant={isRabetInstalled && !isV0Preview ? "default" : "outline"}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Rabet</div>
                  <div className="text-xs text-muted-foreground">{getRabetStatus()}</div>
                </div>
              </div>
            </Button>
            {!isV0Preview && !isRabetInstalled && isClient && (
              <p className="text-xs text-muted-foreground px-2">
                <a
                  href="https://rabet.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Install Rabet
                </a>{" "}
                and unlock it to connect
              </p>
            )}
            {!isV0Preview && isRabetInstalled && !isRabetAvailable && isClient && (
              <p className="text-xs text-orange-500 px-2">
                Rabet is installed but locked. Please unlock your Rabet wallet to continue.
              </p>
            )}
          </div>

          {/* Coming Soon - Albedo */}
          <div className="space-y-2">
            <Button disabled className="w-full h-12 text-left justify-start bg-transparent" variant="outline">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-400 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-muted-foreground">Albedo</div>
                  <div className="text-xs text-muted-foreground">Coming soon</div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting to wallet...
          </div>
        )}
        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
