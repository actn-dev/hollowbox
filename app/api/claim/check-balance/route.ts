import { type NextRequest, NextResponse } from "next/server"

const HVX_ASSET_CODE = "HOLLOWVOX"
const HVX_ISSUER_ADDRESSES = [
  "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
  "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
]

const HORIZON_URL = "https://horizon.stellar.org"

const TIERS = [
  { level: 1, name: "Tier 1", minBalance: 1_000_000 },
  { level: 2, name: "Tier 2", minBalance: 10_000_000 },
  { level: 3, name: "Tier 3", minBalance: 50_000_000 },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter required" }, { status: 400 })
    }

    // Validate Stellar address format
    if (!/^G[A-Z2-7]{55}$/.test(address)) {
      return NextResponse.json({ error: "Invalid Stellar address format" }, { status: 400 })
    }

    // Fetch account data from Stellar Horizon
    const response = await fetch(`${HORIZON_URL}/accounts/${address}`)

    if (!response.ok) {
      if (response.status === 404) {
        // Account not found (unfunded account)
        return NextResponse.json({
          address,
          totalBalance: 0,
          tier: "No Tier",
          tierLevel: 0,
        })
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const account = await response.json()

    // Find all balances that match the HOLLOWVOX asset code and any of the recognized issuers
    const hvxBalanceLines =
      account.balances?.filter(
        (balance: any) =>
          balance.asset_type !== "native" &&
          balance.asset_code === HVX_ASSET_CODE &&
          HVX_ISSUER_ADDRESSES.includes(balance.asset_issuer),
      ) || []

    // Sum the balances from all recognized token lines
    const totalBalance = hvxBalanceLines.reduce(
      (sum: number, line: any) => sum + Number.parseFloat(line.balance || "0"),
      0,
    )

    const currentTier = [...TIERS].reverse().find((t) => totalBalance >= t.minBalance)

    return NextResponse.json({
      address,
      totalBalance,
      tier: currentTier ? currentTier.name : "No Tier",
      tierLevel: currentTier ? currentTier.level : 0,
    })
  } catch (error) {
    console.error("Error checking balance:", error)
    return NextResponse.json({ error: "Failed to check wallet balance" }, { status: 500 })
  }
}
