import { type NextRequest, NextResponse } from "next/server"

// This would typically connect to your database
// For now, we'll use in-memory storage (this will reset on server restart)
let currentImpactData: any = null

export async function GET() {
  try {
    return NextResponse.json(currentImpactData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch current impact" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    currentImpactData = {
      ...data,
      id: Date.now().toString(),
    }
    return NextResponse.json(currentImpactData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create current impact" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    currentImpactData = data
    return NextResponse.json(currentImpactData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update current impact" }, { status: 500 })
  }
}
