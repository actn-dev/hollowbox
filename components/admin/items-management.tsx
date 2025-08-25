"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Trophy, Loader2 } from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type ClaimableItem = RouterOutputs["claim"]["getItems"][0];

interface ItemsManagementProps {
  items: ClaimableItem[];
  onAnnounceWinner: (itemId: string) => void;
  isAnnouncingWinner: string | null;
}

export function ItemsManagement({
  items,
  onAnnounceWinner,
  isAnnouncingWinner,
}: ItemsManagementProps) {
  const canAnnounceWinner = (item: ClaimableItem) => {
    if (item.winnerAnnounced) return false;
    if (item.expirationDate && new Date(item.expirationDate) > new Date())
      return false;
    return true;
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Drawing Items Management
        </CardTitle>
        <CardDescription>
          Manage existing drawing items and announce winners
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 bg-muted/20 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <Badge
                      variant="outline"
                      className={
                        item.isActive
                          ? "border-green-500 text-green-400"
                          : "border-red-500 text-red-400"
                      }
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {item.winnerAnnounced && (
                      <Badge
                        variant="outline"
                        className="border-yellow-500 text-yellow-400"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner Announced
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <div className="font-medium capitalize">
                        {item.category}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Tokens Required:
                      </span>
                      <div className="font-medium">
                        {item.tokensRequired.toLocaleString()} HVX
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Winners:</span>
                      <div className="font-medium">
                        {item.claimsRemaining || "Unlimited"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <div className="font-medium">
                        {item.expirationDate
                          ? formatDateTime(item.expirationDate)
                          : "No expiration"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {canAnnounceWinner(item) && (
                    <Button
                      onClick={() => onAnnounceWinner(item.id)}
                      disabled={isAnnouncingWinner === item.id}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isAnnouncingWinner === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trophy className="h-4 w-4 mr-2" />
                      )}
                      Announce Winner
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
