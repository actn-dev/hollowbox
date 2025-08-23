import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function getCurrentTwoHourWindow() {
  const now = new Date()
  const hours = now.getUTCHours()
  const windowStart = Math.floor(hours / 2) * 2

  const windowStartTime = new Date(now)
  windowStartTime.setUTCHours(windowStart, 0, 0, 0)

  const windowEndTime = new Date(windowStartTime)
  windowEndTime.setUTCHours(windowStartTime.getUTCHours() + 2)

  return { windowStartTime, windowEndTime }
}

function getNextResetTime() {
  const now = new Date()
  const hours = now.getUTCHours()
  const nextResetHour = Math.ceil((hours + 1) / 2) * 2

  const resetTime = new Date(now)
  if (nextResetHour >= 24) {
    resetTime.setUTCDate(resetTime.getUTCDate() + 1)
    resetTime.setUTCHours(0, 0, 0, 0)
  } else {
    resetTime.setUTCHours(nextResetHour, 0, 0, 0)
  }

  return resetTime
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    console.log("Checking scan limit for wallet:", walletAddress)

    const { windowStartTime, windowEndTime } = getCurrentTwoHourWindow()

    // Check scans used in current 2-hour window
    const result = await sql`
      SELECT COUNT(*) as scan_count
      FROM game_rewards 
      WHERE wallet_address = ${walletAddress}
        AND game_type = 'signal-scan'
        AND created_at >= ${windowStartTime.toISOString()}
        AND created_at < ${windowEndTime.toISOString()}
    `

    const scansUsed = Number.parseInt(result[0]?.scan_count || "0")
    const maxScansPerWindow = 5
    const canScan = scansUsed < maxScansPerWindow

    const nextResetTime = getNextResetTime()

    console.log("Scan window calculation:", {
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
      scansUsed,
      canScan,
      nextReset: nextResetTime.toISOString(),
    })

    return NextResponse.json({
      scansUsed,
      maxScansPerWindow,
      remainingScans: maxScansPerWindow - scansUsed,
      canScan,
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
      nextResetTime: nextResetTime.toISOString(),
    })
  } catch (error) {
    console.error("Error checking scan limit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, scanType = "manual" } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const { windowStartTime, windowEndTime } = getCurrentTwoHourWindow()

    // Check current scans in this window
    const checkResult = await sql`
      SELECT COUNT(*) as scan_count
      FROM game_rewards 
      WHERE wallet_address = ${walletAddress}
        AND game_type = 'signal-scan'
        AND created_at >= ${windowStartTime.toISOString()}
        AND created_at < ${windowEndTime.toISOString()}
    `

    const currentScans = Number.parseInt(checkResult[0]?.scan_count || "0")
    const maxScans = 5

    if (currentScans >= maxScans) {
      return NextResponse.json(
        {
          error: "Scan limit reached for this 2-hour window",
          scansUsed: currentScans,
          maxScansPerWindow: maxScans,
          nextResetTime: getNextResetTime().toISOString(),
        },
        { status: 429 },
      )
    }

    // Record the scan
    await sql`
      INSERT INTO game_rewards (wallet_address, game_type, tokens_earned, metadata, created_at)
      VALUES (
        ${walletAddress}, 
        'signal-scan', 
        0,
        ${JSON.stringify({ scanType, window: windowStartTime.toISOString() })},
        NOW()
      )
    `

    // Simulate scan results (random chance of finding signals)
    const foundSignals = []
    const signalChance = 0.3 // 30% chance per scan

    if (Math.random() < signalChance) {
      const signalStrength = Math.random()
      const tokensFound = signalStrength > 0.8 ? 3 : signalStrength > 0.5 ? 2 : 1

      // Record found signal
      await sql`
        INSERT INTO game_rewards (wallet_address, game_type, tokens_earned, metadata, created_at)
        VALUES (
          ${walletAddress}, 
          'signal-found', 
          ${tokensFound},
          ${JSON.stringify({
            signalStrength: Math.round(signalStrength * 100),
            scanType,
            window: windowStartTime.toISOString(),
          })},
          NOW()
        )
      `

      foundSignals.push({
        strength: Math.round(signalStrength * 100),
        tokens: tokensFound,
        type: signalStrength > 0.8 ? "rare" : signalStrength > 0.5 ? "strong" : "weak",
      })
    }

    const newScanCount = currentScans + 1
    const nextResetTime = getNextResetTime()

    return NextResponse.json({
      success: true,
      scansUsed: newScanCount,
      maxScansPerWindow: maxScans,
      remainingScans: maxScans - newScanCount,
      canScan: newScanCount < maxScans,
      foundSignals,
      nextResetTime: nextResetTime.toISOString(),
      windowStart: windowStartTime.toISOString(),
      windowEnd: windowEndTime.toISOString(),
    })
  } catch (error) {
    console.error("Error performing scan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
