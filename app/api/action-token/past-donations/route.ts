import { type NextRequest, NextResponse } from "next/server"

// This would typically connect to your database
// For now, we'll use in-memory storage (this will reset on server restart)
const pastActionPurchasesData: any[] = []

export async function GET() {
  try {
    return NextResponse.json(pastActionPurchasesData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch past $ACTION purchases" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const newPurchase = {
      ...data,
      id: Date.now().toString(),
    }
    pastActionPurchasesData.push(newPurchase)
    return NextResponse.json(newPurchase)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create $ACTION purchase record" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const index = pastActionPurchasesData.findIndex((d) => d.id === data.id)
    if (index !== -1) {
      pastActionPurchasesData[index] = data
      return NextResponse.json(data)
    }
    return NextResponse.json({ error: "$ACTION purchase not found" }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update $ACTION purchase" }, { status: 500 })
  }
}
