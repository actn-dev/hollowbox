import type { Metadata } from "next"
import { ProfitTracker } from "@/components/profit-tracker"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Profit Tracker - The Hollow",
  description: "Track your HOLLOWVOX trading profits and performance.",
}

export default function TrackerPage() {
  return (
    <div className="py-8 space-y-6">
      {/* Status Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-500">Tracker Issue</h3>
            <p className="text-sm text-yellow-500/80">
              We're currently experiencing issues with the profit tracker. Our team is working on a fix and will post an
              update ASAP.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit Tracker</h1>
          <p className="text-muted-foreground">
            Track your HOLLOWVOX trading profits and performance across multiple wallets.
          </p>
        </div>

        <ProfitTracker />
      </div>
    </div>
  )
}
