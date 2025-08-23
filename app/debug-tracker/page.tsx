import { ProfitDebug } from "@/components/profit-debug"

export default function DebugTrackerPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profit Tracker Debug</h1>
          <p className="text-muted-foreground">
            Debug tool to analyze why profit calculations aren't working correctly
          </p>
        </div>
        <ProfitDebug />
      </div>
    </div>
  )
}
