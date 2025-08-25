"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User, Wallet, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/auth-client";

interface GameRewardsBalance {
  totalEarned: number;
  totalClaimed: number;
  availableBalance: number;
}

export function WalletConnectButton({
  isMobile = false,
}: {
  isMobile?: boolean;
}) {
  const { openModal } = useAuthModal();
  const { isConnected, publicKey, walletType } = useAuth();
  const [gameRewards, setGameRewards] = useState<GameRewardsBalance | null>(
    null
  );
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);

  const truncateKey = (key: string | null | undefined) => {
    if (!key) return "";
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  const disconnect = () => {
    authClient.signOut();
  };

  // Fetch game rewards balance when wallet is connected
  useEffect(() => {
    if (isConnected && publicKey) {
      fetchGameRewards();
      // Refresh every 30 seconds to catch new rewards
      const interval = setInterval(fetchGameRewards, 30000);
      return () => clearInterval(interval);
    } else {
      setGameRewards(null);
    }
  }, [isConnected, publicKey]);

  const fetchGameRewards = async () => {
    if (!publicKey) return;

    setIsLoadingRewards(true);
    try {
      const response = await fetch(
        `/api/game-rewards/balance?walletAddress=${publicKey}`
      );
      if (response.ok) {
        const data = await response.json();
        setGameRewards(data);
      }
    } catch (error) {
      console.error("Failed to fetch game rewards:", error);
    } finally {
      setIsLoadingRewards(false);
    }
  };

  const handleClaimTokens = async () => {
    if (!publicKey || !gameRewards?.availableBalance) return;

    try {
      const response = await fetch("/api/game-rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey,
          amount: gameRewards.availableBalance,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchGameRewards(); // Refresh the balance after claiming
      } else {
        const error = await response.json();
        alert(error.error || "Failed to claim tokens");
      }
    } catch (error) {
      console.error("Failed to claim tokens:", error);
      alert("Failed to claim tokens. Please try again.");
    }
  };

  if (isConnected) {
    return (
      <div
        className={cn("flex items-center gap-2", isMobile && "flex-col w-full")}
      >
        {/* Game Tokens Box - Always Visible */}
        {gameRewards && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              <div className="text-sm font-medium">
                {gameRewards.availableBalance > 0 ? (
                  <button
                    onClick={handleClaimTokens}
                    className="hover:underline cursor-pointer"
                  >
                    {gameRewards.availableBalance} Tokens
                  </button>
                ) : (
                  <span>0 Tokens</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn("bg-transparent", isMobile && "w-full")}
            >
              <User className="mr-2 h-4 w-4" />
              {truncateKey(publicKey)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="font-bold">{truncateKey(publicKey)}</div>
              <div className="text-xs text-muted-foreground">
                {walletType === "freighter"
                  ? "Freighter"
                  : walletType === "rabet"
                  ? "Rabet"
                  : walletType}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {gameRewards && (
              <>
                <DropdownMenuItem disabled>
                  <Gamepad2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">Game Rewards</span>
                    <div className="text-xs text-muted-foreground">
                      <div>Total Earned: {gameRewards.totalEarned}</div>
                      <div>Total Claimed: {gameRewards.totalClaimed}</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnect}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button onClick={openModal} className={cn(isMobile && "w-full")}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
