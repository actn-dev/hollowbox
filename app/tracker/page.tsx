import type { Metadata } from "next";
import { ProfitTracker } from "@/components/profit-tracker-new";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Profit Tracker - The Hollow",
  description: "Track your HOLLOWVOX trading profits and performance.",
};

export default function TrackerPage() {
  return (
    <div className="py-8 space-y-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit Tracker</h1>
          <p className="text-muted-foreground">
            Track your HOLLOWVOX trading profits and performance across multiple
            wallets.
          </p>
        </div>

        <ProfitTracker />
      </div>
    </div>
  );
}
