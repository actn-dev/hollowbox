"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Clock, CheckCircle, Truck, X } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type AdminClaim = NonNullable<
  RouterOutputs["claim"]["getAdminDashboard"]
>["claims"][0];

interface ClaimsManagementProps {
  claims: AdminClaim[];
  onUpdateClaimStatus: (claimId: string, status: string) => void;
}

export function ClaimsManagement({
  claims,
  onUpdateClaimStatus,
}: ClaimsManagementProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "border-yellow-500 text-yellow-400", icon: Clock },
      approved: { color: "border-green-500 text-green-400", icon: CheckCircle },
      shipped: { color: "border-blue-500 text-blue-400", icon: Truck },
      completed: {
        color: "border-green-500 text-green-400",
        icon: CheckCircle,
      },
      cancelled: { color: "border-red-500 text-red-400", icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge
        variant="outline"
        className={config?.color || "border-gray-500 text-gray-400"}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Claims Management
        </CardTitle>
        <CardDescription>Review and manage user claims</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {claims.map((claim) => (
            <div key={claim.id} className="p-4 bg-muted/20 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{claim.itemTitle}</h3>
                    {getStatusBadge(claim.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">User:</span>
                      <div className="font-medium">{claim.userInfo.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {claim.userInfo.email}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Wallet:</span>
                      <div className="font-mono text-xs">
                        {claim.walletAddress}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Entries:</span>
                      <div className="font-medium">{claim.entries}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Claimed:</span>
                      <div className="font-medium">
                        {formatDateTime(claim.claimedAt)}
                      </div>
                    </div>
                  </div>
                  {claim.userInfo.address && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Address:</span>
                      <div className="font-medium">
                        {claim.userInfo.address}
                      </div>
                    </div>
                  )}
                  {claim.userInfo.notes && (
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Notes:</span>
                      <div className="font-medium">{claim.userInfo.notes}</div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Select
                    value={claim.status}
                    onValueChange={(value) =>
                      onUpdateClaimStatus(claim.id, value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
