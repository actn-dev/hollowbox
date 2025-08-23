"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"

// --- PRODUCTION CONFIGURATION ---
const HVX_ASSET_CODE = "HOLLOWVOX"
// Array of recognized HOLLOWVOX token issuers
const HVX_ISSUER_ADDRESSES = [
  "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
  "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
]

const HORIZON_URL = "https://horizon.stellar.org"

// CORRECTED TIER SYSTEM - Tier 1 is highest, Tier 3 is entry level
const TIERS = [
  { level: 3, name: "Tier 3", minBalance: 1_000_000 }, // Entry tier - 1M HVX
  { level: 2, name: "Tier 2", minBalance: 10_000_000 }, // Medium tier - 10M HVX
  { level: 1, name: "Tier 1", minBalance: 50_000_000 }, // Highest tier - 50M HVX
]

// Wallet persistence storage keys
const WALLET_STORAGE_KEY = "hollowvox_wallet_connection"
const WALLET_EXPIRY_HOURS = 24

interface WalletState {
  isConnected: boolean
  isLoading: boolean
  error: string | null
  publicKey: string | null
  balance: number | null
  tier: string | null
  tierLevel: number | null
  walletType: "freighter" | "rabet" | null
  connect: (walletType: "freighter" | "rabet") => Promise<void>
  disconnect: () => void
}

interface StoredWalletData {
  publicKey: string
  walletType: "freighter" | "rabet"
  timestamp: number
}

const WalletContext = createContext<WalletState | undefined>(undefined)

// Helper function to save wallet connection to localStorage
function saveWalletConnection(publicKey: string, walletType: "freighter" | "rabet") {
  if (typeof window === "undefined") return

  const walletData: StoredWalletData = {
    publicKey,
    walletType,
    timestamp: Date.now(),
  }

  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletData))
    console.log("Wallet connection saved to localStorage")
  } catch (error) {
    console.error("Failed to save wallet connection:", error)
  }
}

// Helper function to load wallet connection from localStorage
function loadWalletConnection(): StoredWalletData | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY)
    if (!stored) return null

    const walletData: StoredWalletData = JSON.parse(stored)

    // Check if connection has expired (24 hours)
    const hoursElapsed = (Date.now() - walletData.timestamp) / (1000 * 60 * 60)
    if (hoursElapsed > WALLET_EXPIRY_HOURS) {
      console.log("Stored wallet connection has expired")
      localStorage.removeItem(WALLET_STORAGE_KEY)
      return null
    }

    return walletData
  } catch (error) {
    console.error("Failed to load wallet connection:", error)
    localStorage.removeItem(WALLET_STORAGE_KEY)
    return null
  }
}

// Helper function to clear wallet connection from localStorage
function clearWalletConnection() {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(WALLET_STORAGE_KEY)
    console.log("Wallet connection cleared from localStorage")
  } catch (error) {
    console.error("Failed to clear wallet connection:", error)
  }
}

// Helper function to get Stellar server instance
async function getStellarServer() {
  try {
    return {
      loadAccount: async (publicKey: string) => {
        const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`)
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Account not found")
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return await response.json()
      },
    }
  } catch (error) {
    console.error("Failed to create Stellar server:", error)
    throw error
  }
}

function isEmbeddedPreview(): boolean {
  if (typeof window === "undefined") return false
  const inIframe = window.parent && window.parent !== window
  const isV0Host = window.location.hostname.includes("v0.dev")
  return Boolean(inIframe || isV0Host)
}

async function waitForFreighter(timeoutMs = 8000, intervalMs = 250): Promise<any | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const api =
      (window as any).freighterApi ||
      (window as any).freighter ||
      (window as any).stellar?.freighter ||
      (window as any).StellarSdk?.freighter
    if (api && (api.getPublicKey || api.isAllowed || api.isConnected)) {
      return api
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return null
}

// Helper function to check if Freighter is available
function isFreighterAvailable(): boolean {
  if (typeof window === "undefined") return false

  // Check for the Freighter API in the window object
  return !!(window.freighterApi || (window as any).freighter || (window as any).stellar?.freighter)
}

// Helper function to get Freighter API
function getFreighterApi() {
  if (typeof window === "undefined") return null

  // Try different possible locations for Freighter API
  return window.freighterApi || (window as any).freighter || (window as any).stellar?.freighter || null
}

// Helper functions for wallet connections using proper Freighter API
async function connectFreighter(): Promise<string> {
  try {
    console.log("=== FREIGHTER CONNECTION ATTEMPT ===")

    if (typeof window === "undefined") {
      throw new Error("Not in browser environment")
    }

    // Wait up to 8s for injection
    const freighterApi = await waitForFreighter(8000, 250)

    if (!freighterApi) {
      if (isEmbeddedPreview()) {
        throw new Error(
          "Freighter is installed but blocked in embedded preview. Open the app in a new tab or your deployed domain and try again."
        )
      }
      throw new Error(
        "Freighter wallet extension not detected. Make sure it’s installed and unlocked, then refresh the page."
      )
    }

    console.log("Freighter API detected. Checking access...")

    // Preferred flow: isAllowed() then getPublicKey()
    if (typeof freighterApi.isAllowed === "function") {
      try {
        const allowed = await freighterApi.isAllowed()
        console.log("freighterApi.isAllowed():", allowed)

        if (!allowed) {
          throw new Error(
            "Freighter detected, but this site is not allowed. Open the Freighter extension, allow this site, then retry."
          )
        }

        if (typeof freighterApi.getPublicKey === "function") {
          const key = await freighterApi.getPublicKey()
          if (!key) throw new Error("Failed to get public key from Freighter")
          return key
        }
      } catch (e) {
        console.log("isAllowed flow failed, trying fallbacks...", e)
      }
    }

    // Fallback: isConnected() -> getPublicKey()
    if (typeof freighterApi.isConnected === "function") {
      try {
        const connected = await freighterApi.isConnected()
        console.log("freighterApi.isConnected():", connected)
        if (connected && typeof freighterApi.getPublicKey === "function") {
          const key = await freighterApi.getPublicKey()
          if (!key) throw new Error("Failed to get public key from Freighter")
          return key
        }
      } catch (e) {
        console.log("isConnected flow failed, trying direct getPublicKey...", e)
      }
    }

    // Last resort: direct getPublicKey()
    if (typeof freighterApi.getPublicKey === "function") {
      const key = await freighterApi.getPublicKey()
      if (!key) throw new Error("Failed to get public key from Freighter")
      return key
    }

    throw new Error(
      "Freighter detected but its API isn’t accessible. Ensure the extension is unlocked and this site is allowed."
    )
  } catch (error: any) {
    console.error("Freighter connection error:", error)
    throw new Error(error.message || "Failed to connect to Freighter")
  }
}

async function connectRabet(): Promise<string> {
  try {
    // Check if we're in v0 preview environment
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.includes("v0.dev") ||
        (window.location.hostname.includes("localhost") && window.parent !== window))
    ) {
      throw new Error("Rabet wallet is not available in v0 preview environment. Please test in production.")
    }

    // Check if Rabet is available in the browser
    if (typeof window === "undefined" || !window.rabet) {
      throw new Error("Rabet wallet is not installed. Please install Rabet extension.")
    }

    console.log("Rabet found, attempting to connect...")

    // Check if Rabet is unlocked
    const isUnlocked = await window.rabet.isUnlocked()
    if (!isUnlocked) {
      throw new Error("Rabet wallet is locked. Please unlock it first and try again.")
    }

    console.log("Rabet is unlocked, connecting...")

    // Connect to Rabet
    const result = await window.rabet.connect()

    console.log("Rabet connect result:", result)

    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.publicKey) {
      throw new Error("Failed to get public key from Rabet")
    }

    console.log("Successfully connected to Rabet:", result.publicKey)
    return result.publicKey
  } catch (error: any) {
    console.error("Rabet connection error:", error)
    throw new Error(error.message || "Failed to connect to Rabet")
  }
}

// Helper function to restore wallet connection without user interaction
async function restoreWalletConnection(walletType: "freighter" | "rabet", publicKey: string): Promise<boolean> {
  try {
    if (walletType === "freighter") {
      try {
        const freighter = await waitForFreighter(3000, 250)
        if (!freighter) return false

        if (typeof freighter.isAllowed === "function") {
          const allowed = await freighter.isAllowed()
          if (!allowed) return false
          const currentPublicKey = await freighter.getPublicKey()
          return currentPublicKey === publicKey
        }

        if (typeof freighter.isConnected === "function") {
          const connected = await freighter.isConnected()
          if (!connected) return false
          const currentPublicKey = await freighter.getPublicKey()
          return currentPublicKey === publicKey
        }

        if (typeof freighter.getPublicKey === "function") {
          const currentPublicKey = await freighter.getPublicKey()
          return currentPublicKey === publicKey
        }

        return false
      } catch {
        return false
      }
    } else if (walletType === "rabet") {
      if (typeof window === "undefined" || !window.rabet) {
        return false
      }

      const isUnlocked = await window.rabet.isUnlocked()
      if (!isUnlocked) {
        return false
      }

      return true
    }

    return false
  } catch (error) {
    console.error("Failed to restore wallet connection:", error)
    return false
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<WalletState, "connect" | "disconnect">>({
    isConnected: false,
    isLoading: false,
    error: null,
    publicKey: null,
    balance: null,
    tier: null,
    tierLevel: null,
    walletType: null,
  })

  // Auto-restore wallet connection on mount
  useEffect(() => {
    const restoreConnection = async () => {
      const storedWallet = loadWalletConnection()
      if (!storedWallet) return

      console.log("Attempting to restore wallet connection:", storedWallet.walletType)
      setState((s) => ({ ...s, isLoading: true }))

      try {
        const isValid = await restoreWalletConnection(storedWallet.walletType, storedWallet.publicKey)

        if (isValid) {
          console.log("Wallet connection restored successfully")
          await fetchAccountDetails(storedWallet.publicKey, storedWallet.walletType)
        } else {
          console.log("Stored wallet connection is no longer valid")
          clearWalletConnection()
          setState((s) => ({ ...s, isLoading: false }))
        }
      } catch (error) {
        console.error("Failed to restore wallet connection:", error)
        clearWalletConnection()
        setState((s) => ({ ...s, isLoading: false }))
      }
    }

    restoreConnection()
  }, [])

  // Set up Rabet event listeners
  useEffect(() => {
    if (typeof window !== "undefined" && window.rabet) {
      const handleAccountChanged = () => {
        console.log("Rabet account changed")
        clearWalletConnection()
        disconnect()
      }

      const handleNetworkChanged = (networkId: string) => {
        console.log("Rabet network changed to:", networkId)
      }

      try {
        window.rabet.on("accountChanged", handleAccountChanged)
        window.rabet.on("networkChanged", handleNetworkChanged)
      } catch (error) {
        console.log("Failed to set up Rabet event listeners:", error)
      }
    }
  }, [])

  const disconnect = useCallback(() => {
    clearWalletConnection()
    setState({
      isConnected: false,
      isLoading: false,
      error: null,
      publicKey: null,
      balance: null,
      tier: null,
      tierLevel: null,
      walletType: null,
    })
    console.log("Wallet disconnected.")
  }, [])

  const fetchAccountDetails = useCallback(
    async (publicKey: string, walletType: "freighter" | "rabet") => {
      try {
        console.log("🔍 Fetching account details for:", publicKey.substring(0, 8) + "...")
        const server = await getStellarServer()
        const account = await server.loadAccount(publicKey)

        console.log("📊 Account loaded, checking balances...")

        // Find all balances that match the HOLLOWVOX asset code and any of the recognized issuers
        const hvxBalanceLines =
          account.balances?.filter(
            (balance: any) =>
              balance.asset_type !== "native" &&
              balance.asset_code === HVX_ASSET_CODE &&
              HVX_ISSUER_ADDRESSES.includes(balance.asset_issuer),
          ) || []

        console.log("💰 Found HVX balance lines:", hvxBalanceLines.length)

        // Sum the balances from all recognized token lines
        const totalHvxBalance = hvxBalanceLines.reduce(
          (sum: number, line: any) => sum + Number.parseFloat(line.balance || "0"),
          0,
        )

        console.log("💎 Total HVX balance:", totalHvxBalance.toLocaleString())

        // Find the HIGHEST tier the user qualifies for (lowest tier number = highest tier)
        // Sort tiers by minBalance descending to check highest requirements first
        const sortedTiers = [...TIERS].sort((a, b) => b.minBalance - a.minBalance)
        const currentTier = sortedTiers.find((t) => totalHvxBalance >= t.minBalance)

        console.log("🏆 Current tier:", currentTier ? `${currentTier.name} (Level ${currentTier.level})` : "No Tier")

        const newState = {
          isConnected: true,
          isLoading: false,
          error: null,
          publicKey,
          balance: totalHvxBalance,
          tier: currentTier ? currentTier.name : "No Tier",
          tierLevel: currentTier ? currentTier.level : 0,
          walletType,
        }

        setState(newState)

        // Save successful connection to localStorage
        saveWalletConnection(publicKey, walletType)
      } catch (e: any) {
        console.error("Error fetching account details:", e)

        // Handle account not found (unfunded account)
        if (e.message?.includes("not found") || e.message?.includes("404")) {
          console.log("📭 Account not found - treating as unfunded account")
          const newState = {
            isConnected: true,
            isLoading: false,
            error: null,
            publicKey,
            balance: 0,
            tier: "No Tier",
            tierLevel: 0,
            walletType,
          }

          setState(newState)

          // Save successful connection to localStorage even for unfunded accounts
          saveWalletConnection(publicKey, walletType)
        } else {
          clearWalletConnection()
          disconnect()
          setState((s) => ({ ...s, error: "Failed to load account from Stellar network." }))
        }
      }
    },
    [disconnect],
  )

  const connect = useCallback(
    async (walletType: "freighter" | "rabet") => {
      setState((s) => ({ ...s, isLoading: true, error: null }))

      try {
        let publicKey: string

        if (walletType === "freighter") {
          publicKey = await connectFreighter()
        } else if (walletType === "rabet") {
          publicKey = await connectRabet()
        } else {
          throw new Error("Unsupported wallet type")
        }

        await fetchAccountDetails(publicKey, walletType)
      } catch (e: any) {
        console.error("Wallet connection failed:", e)
        setState((s) => ({
          ...s,
          isLoading: false,
          error: e.message || "Connection was rejected.",
        }))
      }
    },
    [fetchAccountDetails],
  )

  return <WalletContext.Provider value={{ ...state, connect, disconnect }}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

// Extend the Window interface to include freighter and rabet
declare global {
  interface Window {
    freighterApi?: {
      isAllowed: () => Promise<boolean>
      isConnected?: () => Promise<boolean>
      getPublicKey: () => Promise<string>
      signTransaction: (xdr: string) => Promise<string>
    }
    rabet?: {
      connect: () => Promise<{ publicKey: string; error?: string }>
      sign: (xdr: string, network: string) => Promise<{ xdr: string; error?: string }>
      disconnect: () => Promise<void>
      isUnlocked: () => Promise<boolean>
      close: () => Promise<void>
      on: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}
