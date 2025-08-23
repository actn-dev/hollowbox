import { type NextRequest, NextResponse } from "next/server"
import { monitoringStore } from "@/lib/monitoring-store"

export async function POST(request: NextRequest) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get("authorization")
    const expectedToken = process.env.LOG_API_SECRET

    if (!expectedToken) {
      console.error("LOG_API_SECRET environment variable not set")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid authorization token" }, { status: 401 })
    }

    const body = await request.json()
    const { wallet, type, asset, amount, timestamp, transaction_hash } = body

    // Validate all required fields
    const requiredFields = ["wallet", "type", "asset", "amount", "timestamp", "transaction_hash"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missing: missingFields,
        },
        { status: 400 },
      )
    }

    // Store the log entry
    const logEntry = monitoringStore.addSuspiciousLog({
      wallet,
      type,
      asset,
      amount,
      timestamp,
      transaction_hash,
    })

    return NextResponse.json({
      success: true,
      message: "Suspicious activity logged successfully",
      entry: logEntry,
    })
  } catch (error) {
    console.error("Error logging suspicious activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const logs = await monitoringStore.getSuspiciousLogs()
    return NextResponse.json({
      logs,
      count: logs.length,
    })
  } catch (error) {
    console.error("Error fetching suspicious logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
