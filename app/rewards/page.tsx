"use client";

import { useState, useEffect } from "react";
import { RewardCard } from "@/components/reward-card";
import type { Reward } from "@/lib/types";
import { useWallet } from "@/contexts/wallet-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Circle, Star, Crown, CheckCircle, Lock, Wallet } from "lucide-react";
import { api, type RouterOutputs } from "~/trpc/react";

const allRewards: Reward[] = [];

type TierConfig = RouterOutputs["tiers"]["getTiers"][0];

export default function RewardsPage() {
  const { isConnected, tierLevel, balance, connect, isLoading } = useWallet();
  const { data: tiers, isLoading: tiersLoading } =
    api.tiers.getTiers.useQuery();

  const getUserTier = () => {
    if (!balance || balance === null || !tiers || tiers.length === 0) return 0;
    const numBalance = balance;

    let highestQualifiedTier = 0;

    const sortedTiers = [...tiers].sort(
      (a, b) => b.tokenRequirement - a.tokenRequirement
    );

    for (const tier of sortedTiers) {
      if (numBalance >= tier.tokenRequirement) {
        highestQualifiedTier = tier.tierLevel;
        break;
      }
    }

    return highestQualifiedTier;
  };

  const currentTier = tierLevel || getUserTier();
  const currentTierData = tiers?.find((tier) => tier.tierLevel === currentTier);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Crown":
        return Crown;
      case "Star":
        return Star;
      case "Circle":
      default:
        return Circle;
    }
  };

  const getNextTierRequirement = () => {
    if (!tiers) return null;
    if (currentTier === 0) {
      return tiers.find((tier) => tier.tierLevel === 3);
    } else if (currentTier > 1) {
      return tiers.find((tier) => tier.tierLevel === currentTier - 1);
    }
    return null;
  };

  if (!isConnected) {
    return (
      <div className="py-12 md:py-16">
        <div className="text-center">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl">
            Hollower Rewards
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Connect your wallet to view your tier status and available rewards
            for Hollowers in The Hollow.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => connect("freighter")}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {isLoading ? "Connecting..." : "Connect Freighter"}
            </Button>
            <Button
              onClick={() => connect("rabet")}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              {isLoading ? "Connecting..." : "Connect Rabet"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (tiersLoading) {
    return (
      <div className="py-12 md:py-16">
        <div className="text-center">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl">
            Hollower Rewards
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Loading tier information...
          </p>
        </div>
      </div>
    );
  }

  const nextTier = getNextTierRequirement();

  return (
    <div className="py-12 md:py-16">
      <div className="text-center">
        <h1 className="font-orbitron text-4xl font-bold md:text-5xl">
          Hollower Rewards
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Your tier determines your access to exclusive rewards, benefits, and
          experiences in The Hollow ecosystem.
        </p>
      </div>

      <div className="mt-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="font-orbitron text-2xl">
              Your Current Status
            </CardTitle>
            <CardDescription>
              Balance: {balance ? balance.toLocaleString() : "0"} HVX tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {currentTier > 0 ? (
              <div className="flex items-center justify-center gap-3">
                {currentTierData && (
                  <>
                    {(() => {
                      const IconComponent = getIconComponent(
                        currentTierData.tierIcon
                      );
                      return (
                        <IconComponent
                          className={`h-8 w-8 ${currentTierData.tierColor}`}
                        />
                      );
                    })()}
                    <Badge
                      variant="outline"
                      className={`text-lg px-4 py-2 ${currentTierData.tierColor} ${currentTierData.tierBorderColor}`}
                    >
                      Tier {currentTier}: {currentTierData.tierName}
                    </Badge>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Lock className="h-8 w-8 text-muted-foreground" />
                <Badge
                  variant="outline"
                  className="text-lg px-4 py-2 text-muted-foreground"
                >
                  No Tier - Need{" "}
                  {tiers && tiers.length > 0
                    ? tiers
                        .find((t) => t.tierLevel === 3)
                        ?.tokenRequirement.toLocaleString()
                    : "0"}
                  + HVX
                </Badge>
              </div>
            )}

            {nextTier && (
              <p className="text-sm text-muted-foreground mt-4">
                {currentTier === 0
                  ? `Acquire ${(
                      nextTier.tokenRequirement - (balance || 0)
                    ).toLocaleString()} more HVX to reach Tier ${
                      nextTier.tierLevel
                    }`
                  : `Acquire ${(
                      nextTier.tokenRequirement - (balance || 0)
                    ).toLocaleString()} more HVX to reach Tier ${
                      nextTier.tierLevel
                    } (${nextTier.tierName})`}
              </p>
            )}

            {currentTier === 1 && (
              <p className="text-sm text-green-400 mt-4 font-semibold">
                🎉 Congratulations! You've reached the highest tier - Void
                Walker!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-16">
        <h2 className="font-orbitron text-3xl font-bold text-center mb-8">
          Tier Requirements & Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers
            ?.sort((a, b) => a.tierLevel - b.tierLevel)
            .map((tier) => {
              const isUnlocked =
                currentTier > 0 && currentTier <= tier.tierLevel;
              const IconComponent = getIconComponent(tier.tierIcon);

              return (
                <Card
                  key={tier.id}
                  className={`relative transition-all duration-300 ${
                    isUnlocked
                      ? `${tier.tierBgColor} ${tier.tierBorderColor} border-2`
                      : "bg-muted/20 border-muted/20"
                  }`}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <IconComponent
                        className={`h-8 w-8 ${
                          isUnlocked ? tier.tierColor : "text-muted-foreground"
                        }`}
                      />
                      {isUnlocked && (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      )}
                    </div>
                    <CardTitle
                      className={`font-orbitron text-xl ${
                        isUnlocked ? tier.tierColor : "text-muted-foreground"
                      }`}
                    >
                      Tier {tier.tierLevel}: {tier.tierName}
                    </CardTitle>
                    <CardDescription>
                      Requires {tier.tokenRequirement.toLocaleString()} HVX
                      tokens
                    </CardDescription>
                    {isUnlocked && (
                      <Badge
                        variant="outline"
                        className={`w-fit mx-auto ${tier.tierColor} ${tier.tierBorderColor}`}
                      >
                        Unlocked
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3">Benefits:</h4>
                    <ul className="space-y-2">
                      {(tier.benefits as string[]).map((benefit, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              isUnlocked
                                ? "text-green-400"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={
                              isUnlocked ? "" : "text-muted-foreground"
                            }
                          >
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-orbitron text-3xl font-bold text-center mb-8">
          Available Rewards
        </h2>
        {allRewards.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {allRewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                userTier={currentTier}
              />
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <h3 className="font-orbitron text-2xl font-bold mb-4">
                Rewards Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Exclusive rewards and benefits are being prepared for each tier.
                Check back soon for digital collectibles, physical merchandise,
                and real-world experiences.
              </p>
              <Button asChild>
                <Link href="/tracker">Track Your Holdings</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {currentTier !== 1 && (
        <div className="mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <CardContent className="text-center py-8">
              <h3 className="font-orbitron text-xl font-bold mb-4">
                {currentTier === 0
                  ? "Unlock Your First Tier"
                  : "Upgrade to Higher Tier"}
              </h3>
              <p className="text-muted-foreground mb-6">
                Acquire more HVX tokens to unlock exclusive benefits and
                rewards. Higher tiers provide greater access to The Hollow
                ecosystem.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/tracker">View Holdings</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link
                    href="https://stellarexpert.io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buy HVX
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
