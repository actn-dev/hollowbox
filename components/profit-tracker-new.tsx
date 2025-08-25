"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  Globe,
  Heart,
  Droplets,
  Activity,
  Database,
  Wallet,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

import { api } from "~/trpc/react";
import { LIQUIDITY_PROVIDER_WALLET } from "~/lib/types/profit-tracker";

export function ProfitTracker() {
  const [showTransactions, setShowTransactions] = useState<string | null>(null);

  // TRPC queries and mutations
  const {
    data: profitData,
    isLoading,
    error: fetchError,
    refetch,
  } = api.profitTracker.getData.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const updateFromStellar = api.profitTracker.updateFromStellar.useMutation({
    onSuccess: () => {
      // Refetch data after successful update
      refetch();
    },
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handleUpdateFromStellar = async () => {
    try {
      await updateFromStellar.mutateAsync();
    } catch (error) {
      console.error("Error updating from Stellar:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            HOLLOWVOX Token Tracker
          </CardTitle>
          <CardDescription>Loading token data from database...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fetchError || !profitData) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            HOLLOWVOX Token Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {fetchError?.message || "Failed to fetch profit tracker data"}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleUpdateFromStellar}
              disabled={updateFromStellar.isPending}
              variant="outline"
            >
              <Database
                className={`h-4 w-4 mr-2 ${
                  updateFromStellar.isPending ? "animate-spin" : ""
                }`}
              />
              Update from Stellar
            </Button>
            <Button onClick={handleRefresh} variant="ghost">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              HOLLOWVOX Token Tracker
              <Database
                className="h-5 w-5 text-blue-400"
                title="Database-powered"
              />
            </CardTitle>
            <CardDescription className="mt-2">
              Profit tracking from Stellar network • Last updated:{" "}
              {profitData.lastRefresh}
              <span className="text-blue-400 ml-2">• Database-powered</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpdateFromStellar}
              variant="default"
              size="sm"
              disabled={updateFromStellar.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Database
                className={`h-4 w-4 mr-2 ${
                  updateFromStellar.isPending ? "animate-spin" : ""
                }`}
              />
              {updateFromStellar.isPending
                ? "Updating..."
                : "Update from Stellar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <DollarSign className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">
              {profitData.combinedProfit.toFixed(2)} XLM
            </div>
            <div className="text-sm text-muted-foreground">Total Profit</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary">
              {profitData.combinedActionFund.toFixed(2)} XLM
            </div>
            <div className="text-sm text-muted-foreground">$ACTION Fund</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Heart className="h-8 w-8 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-pink-400">
              {profitData.combinedImpactFund.toFixed(2)} XLM
            </div>
            <div className="text-sm text-muted-foreground">Impact Fund</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Droplets className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-400">
              {profitData.combinedLiquidity.toFixed(2)} XLM
            </div>
            <div className="text-sm text-muted-foreground">
              Liquidity Provided
            </div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Activity className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400">
              {profitData.totalTransactions}
            </div>
            <div className="text-sm text-muted-foreground">Total Trades</div>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <Badge
              variant="outline"
              className="border-primary text-primary mb-2"
            >
              Action Token
            </Badge>
            <div className="text-lg font-bold">20%</div>
            <div className="text-sm text-muted-foreground">
              Total Commitment
            </div>
          </div>
        </div>

        {/* Action Token Commitment Breakdown */}
        <Alert className="border-primary/50 bg-primary/10">
          <Heart className="h-4 w-4 text-primary" />
          <AlertDescription className="text-white">
            <strong>Action Token Commitment:</strong> 20% of profits committed
            to good - {profitData.combinedActionFund.toFixed(2)} XLM for $ACTION
            token purchases and giveaways +{" "}
            {profitData.combinedImpactFund.toFixed(2)} XLM for Impact Fund
            donations
            {profitData.combinedLiquidity > 0 && (
              <span>
                {" "}
                + {profitData.combinedLiquidity.toFixed(2)} XLM provided to
                XLM/HOLLOWVOX liquidity pool for ecosystem growth
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Wallet Details */}
        <div className="space-y-4">
          <h3 className="font-orbitron text-xl font-bold">Tracked Wallets</h3>
          {profitData.wallets.map((wallet) => (
            <Card key={wallet.address} className="bg-muted/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Wallet
                      className="h-6 w-6"
                      style={{ color: wallet.color }}
                    />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {wallet.name}
                        {wallet.address === LIQUIDITY_PROVIDER_WALLET && (
                          <Badge
                            variant="outline"
                            className="border-blue-400 text-blue-400"
                          >
                            <Droplets className="h-3 w-3 mr-1" />
                            LP
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {wallet.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setShowTransactions(
                          showTransactions === wallet.address
                            ? null
                            : wallet.address
                        )
                      }
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      {showTransactions === wallet.address
                        ? "Hide"
                        : "Show"}{" "}
                      Transactions
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <a
                        href={`https://stellar.expert/explorer/public/account/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on StellarExpert"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {wallet.error ? (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      Error: {wallet.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {/* Current Balances */}
                    <div className="bg-muted/20 rounded-lg p-3">
                      <h4 className="font-semibold mb-2 text-sm">
                        Current Balances
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        {Object.entries(wallet.currentBalances).map(
                          ([asset, balance]) => (
                            <div key={asset} className="text-center">
                              <div className="text-muted-foreground">
                                {asset}
                              </div>
                              <div className="font-mono font-bold">
                                {Number(balance).toLocaleString()}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Trading Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          HOLLOWVOX Sold
                        </div>
                        <div className="font-mono font-bold">
                          {wallet.totalHollowvoxSold.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          XLM Received
                        </div>
                        <div className="font-mono font-bold text-green-400">
                          {wallet.totalXlmReceived.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Avg Price</div>
                        <div className="font-mono font-bold">
                          {wallet.averageSellPrice.toFixed(6)} XLM
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          $ACTION Fund
                        </div>
                        <div className="font-mono font-bold text-primary">
                          {wallet.actionFundAllocation.toFixed(2)} XLM
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Impact Fund</div>
                        <div className="font-mono font-bold text-pink-400">
                          {wallet.impactFundAllocation.toFixed(2)} XLM
                        </div>
                      </div>
                    </div>

                    {/* Liquidity Metrics (only for LP wallet) */}
                    {wallet.address === LIQUIDITY_PROVIDER_WALLET &&
                      wallet.totalLiquidityProvided > 0 && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-400" />
                            Liquidity Pool Contributions
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">
                                Total Provided
                              </div>
                              <div className="font-mono font-bold text-blue-400">
                                {wallet.totalLiquidityProvided.toFixed(2)}{" "}
                                Shares
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Recent Transactions */}
                    {showTransactions === wallet.address &&
                      wallet.recentTransactions.length > 0 && (
                        <div className="bg-muted/20 rounded-lg p-3">
                          <h4 className="font-semibold mb-2 text-sm">
                            Recent Transactions
                          </h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {wallet.recentTransactions.map((tx) => (
                              <div
                                key={tx.id}
                                className="flex justify-between items-center p-2 bg-background/50 rounded text-xs"
                              >
                                <div>
                                  <div className="font-medium">
                                    {tx.type === "sell" && "HOLLOWVOX Sale"}
                                    {tx.type === "liquidity_deposit" &&
                                      "LP Deposit"}
                                    {tx.type === "payment" && "Payment"}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {new Date(tx.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {tx.hollowvoxAmount > 0 && (
                                    <div className="text-red-400">
                                      -{tx.hollowvoxAmount.toFixed(2)} HOLLOWVOX
                                    </div>
                                  )}
                                  {tx.xlmAmount > 0 && (
                                    <div className="text-green-400">
                                      +{tx.xlmAmount.toFixed(2)} XLM
                                    </div>
                                  )}
                                  {tx.poolShares && (
                                    <div className="text-blue-400">
                                      +{tx.poolShares.toFixed(2)} Shares
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-muted-foreground text-center border-t border-border/50 pt-4 space-y-1">
          <p>
            * Profit calculations based on XLM received from HOLLOWVOX token
            trades on Stellar DEX
          </p>
          <p>
            * Action Token commitment allocates 20% of profits for ecosystem
            development and social impact
          </p>
          <p>* Data refreshed from Stellar network via Horizon API</p>
        </div>
      </CardContent>
    </Card>
  );
}
