"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// HOLLOWVOX token issuers
const HVX_ISSUERS = [
  {
    address: "GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    name: "HOLLOWVOX-1",
    color: "#00ff76",
    stellarExpertUrl:
      "https://stellar.expert/explorer/public/asset/HOLLOWVOX-GBPC4LULQFYZ3C5UD4C7ALAYIOXZ3L7I77XBTXQ7PLSUOXQUUZAVLMAX",
    bandcoinUrl:
      "https://www.bandcoin.io/fans/creator/GDHJSO4ZGWQRKCUEAMRG3B2D7DAJCM3WCL32KBTRG2J7S7UM6WPRBYOY",
  },
  {
    address: "GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
    name: "HOLLOWVOX-2",
    color: "#ff6b00",
    stellarExpertUrl:
      "https://stellar.expert/explorer/public/asset/HOLLOWVOX-GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
    lumemeUrl:
      "https://lu.meme/explore/memes/HOLLOWVOX-GAUDPOA3YKO35IWSA4CMQPKE3MQSK53RPNFWTTP7UCP7QYTMSMEIEJLF",
  },
];

interface TokenStats {
  price: number;
  volume24h: number;
  change24h: number;
  marketCap: number;
  supply: number;
  trades: number;
  lastUpdated: string;
}

export function HomeTokenStats() {
  const [tokenStats, setTokenStats] = useState<{ [key: string]: TokenStats }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTokenStats = async () => {
    try {
      setError(null);
      const response = await fetch("/api/token-stats", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setTokenStats(result.data);
        setLastRefresh(new Date());
      } else {
        throw new Error(result.error || "Failed to fetch token stats");
      }
    } catch (err) {
      console.error("Error fetching token stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch token statistics"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchTokenStats()

  //   // Refresh data every 2 minutes
  //   const interval = setInterval(fetchTokenStats, 2 * 60 * 1000)
  //   return () => clearInterval(interval)
  // }, [])

  const handleRefresh = () => {
    setIsLoading(true);
    fetchTokenStats();
  };

  if (isLoading && !lastRefresh) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm">
            <CardContent className="flex h-[300px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading live data...</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !lastRefresh) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex h-[200px] items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-2">Failed to load token data</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalMarketCap = Object.values(tokenStats).reduce(
    (sum, stats) => sum + stats.marketCap,
    0
  );
  const totalVolume = Object.values(tokenStats).reduce(
    (sum, stats) => sum + stats.volume24h,
    0
  );
  const totalTrades = Object.values(tokenStats).reduce(
    (sum, stats) => sum + stats.trades,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-orbitron text-xl">
              Combined Statistics
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              {lastRefresh && (
                <span className="text-xs text-muted-foreground">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Total Market Cap
              </p>
              <p className="font-bold text-lg">
                $
                {totalMarketCap > 0
                  ? totalMarketCap.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : "0"}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="font-bold text-lg">
                {totalVolume > 0
                  ? totalVolume.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : "0"}
              </p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">24h Trades</p>
              <p className="font-bold text-lg">{totalTrades}</p>
            </div>
            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Active Tokens
              </p>
              <p className="font-bold text-lg">{HVX_ISSUERS.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Token Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {HVX_ISSUERS.map((issuer) => {
          const stats = tokenStats[issuer.name];
          if (!stats) return null;

          return (
            <Card
              key={issuer.address}
              className="bg-card/50 backdrop-blur-sm border-2"
              style={{ borderColor: `${issuer.color}20` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="font-orbitron text-xl">
                      {issuer.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      style={{ borderColor: issuer.color, color: issuer.color }}
                    >
                      HOLLOWVOX
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a
                      href={issuer.stellarExpertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on StellarExpert"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {issuer.address.slice(0, 12)}...{issuer.address.slice(-12)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Price
                    </p>
                    <p className="font-bold text-xl">
                      ${stats.price > 0 ? stats.price.toFixed(6) : "0.000000"}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/10 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      24h Change
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      {stats.change24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span
                        className={`font-bold ${
                          stats.change24h >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {stats.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      24h Volume
                    </span>
                    <span className="font-mono text-lg font-semibold">
                      {stats.volume24h > 0
                        ? stats.volume24h.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                        : "0"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">
                      Supply
                    </span>
                    <span className="font-mono text-lg font-semibold">
                      {stats.supply > 0
                        ? stats.supply.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })
                        : "0"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">
                    Market Cap
                  </span>
                  <span className="font-bold text-xl">
                    $
                    {stats.marketCap > 0
                      ? stats.marketCap.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "0"}
                  </span>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      asChild
                    >
                      <a
                        href={issuer.stellarExpertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        StellarExpert
                      </a>
                    </Button>
                    {issuer.lumemeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        asChild
                      >
                        <a
                          href={issuer.lumemeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          lu.meme
                        </a>
                      </Button>
                    )}
                    {issuer.bandcoinUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        asChild
                      >
                        <a
                          href={issuer.bandcoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Bandcoin
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
