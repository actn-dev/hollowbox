import { type NextRequest, NextResponse } from "next/server"

// This would typically connect to your database
// For now, we'll use in-memory storage (this will reset on server restart)
const pastActionPurchasesData: any[] = []

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const index = pastActionPurchasesData.findIndex((d) => d.id === id)
    if (index !== -1) {
      pastActionPurchasesData.splice(index, 1)
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: "$ACTION purchase not found" }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete $ACTION purchase" }, { status: 500 })
  }
}
