"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Vote, Globe, Target, Calendar, CheckCircle } from "lucide-react"

interface Cause {
  id: string
  name: string
  votes: number
  percentage: number
}

interface MonthlyImpact {
  currentMonth: string
  fundsRaised: number
  votingEnds: string
  topCauses: Cause[]
}

interface PastDonation {
  id: string
  month: string
  recipient: string
  amount: number
  impact: string
}

export default function ActionTokenPage() {
  const [monthlyImpact, setMonthlyImpact] = useState<MonthlyImpact | null>(null)
  const [pastDonations, setPastDonations] = useState<PastDonation[]>([])
  const [pastActionPurchases, setPastActionPurchases] = useState<PastDonation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActionTokenData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch current month impact data
        const impactResponse = await fetch("/api/action-token/current-impact")
        if (impactResponse.ok) {
          const impactData = await impactResponse.json()
          setMonthlyImpact(impactData)
        }

        // Fetch past donations (Impact Fund)
        const donationsResponse = await fetch("/api/action-token/past-donations")
        if (donationsResponse.ok) {
          const donationsData = await donationsResponse.json()
          setPastDonations(donationsData)
        }

        // Fetch past $ACTION purchases
        const actionResponse = await fetch("/api/action-token/past-action-purchases")
        if (actionResponse.ok) {
          const actionData = await actionResponse.json()
          setPastActionPurchases(actionData)
        }
      } catch (err) {
        console.error("Error fetching Action Token data:", err)
        setError("Failed to load Action Token data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActionTokenData()
  }, [])

  const totalDonated = pastDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const totalActionPurchased = pastActionPurchases.reduce((sum, purchase) => sum + purchase.amount, 0)

  return (
    <div className="py-12 md:py-16">
      <div className="text-center mb-12">
        <Badge variant="outline" className="border-primary text-primary text-lg px-4 py-2 mb-4">
          <Globe className="h-4 w-4 mr-2" />
          Part of the ACTIONverse
        </Badge>
        <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">
          HOLLOWVOX is an{" "}
          <a
            href="https://action-tokens.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline decoration-primary/50 hover:decoration-primary"
          >
            Action Token
          </a>
        </h1>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
          Built on purpose. Backed by community. Supporting the ACTIONverse and making real-world impact.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Main Pledge */}
        <Card className="bg-gradient-to-br from-primary/10 via-card/50 to-secondary/10 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="font-orbitron text-3xl">Our Commitment to Good</CardTitle>
            <CardDescription className="text-lg mt-4">
              $HOLLOWVOX isn't just a meme — it's an Action Token, which means we're committed to doing real good, every
              single month.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-card/50 rounded-lg border border-primary/20">
                <Target className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="font-orbitron text-2xl font-bold mb-2">20% Pledge</h3>
                <p className="text-muted-foreground">
                  20% of all HOLLOWVOX profits from token sales, partnerships, merchandise, or any revenue-generating
                  activity will be split: 10% for $ACTION token purchases and giveaways, 10% for Impact Fund donations
                  to causes selected by the community.
                </p>
              </div>
              <div className="text-center p-6 bg-card/50 rounded-lg border border-primary/20">
                <Vote className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="font-orbitron text-2xl font-bold mb-2">Community Decides</h3>
                <p className="text-muted-foreground">
                  Token holders vote each month on both funds. Whether it's $ACTION token giveaways for the ACTIONverse
                  or donations to youth programs, mental health, animal rescue, or disaster relief — you help direct
                  both impacts.
                </p>
              </div>
            </div>

            <div className="text-center py-6">
              <h4 className="font-orbitron text-xl font-bold mb-4">Together, we don't just hold the token...</h4>
              <p className="text-2xl font-bold text-primary">We move the world forward.</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Voting */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Current Monthly Funds
            </CardTitle>
            <CardDescription className="mt-2">
              Community voting for this month's $ACTION token and Impact Fund distributions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-32 mx-auto" />
              </div>
            ) : monthlyImpact ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 rounded-lg">
                    <div>
                      <h3 className="font-orbitron text-lg font-bold">$ACTION Fund</h3>
                      <p className="text-muted-foreground text-sm">For ACTIONverse support</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        ${(monthlyImpact.fundsRaised * 0.5).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 rounded-lg">
                    <div>
                      <h3 className="font-orbitron text-lg font-bold">Impact Fund</h3>
                      <p className="text-muted-foreground text-sm">For donation causes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400">
                        ${(monthlyImpact.fundsRaised * 0.5).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {monthlyImpact.votingEnds && (
                  <Alert className="border-primary/50 bg-primary/10">
                    <Vote className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary-foreground/90">
                      <strong>Voting ends {new Date(monthlyImpact.votingEnds).toLocaleDateString()}</strong> - Connect
                      your wallet to participate in both fund decisions!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center">
                  <Button size="lg" className="font-bold" disabled>
                    <Vote className="h-4 w-4 mr-2" />
                    Vote Now (Coming Soon)
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No active voting period at this time.</p>
                <p className="text-sm text-muted-foreground mt-2">Check back soon for the next community vote!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Impact - Tabbed */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Our Impact So Far
            </CardTitle>
            <CardDescription>
              Real $ACTION token purchases and Impact Fund donations, decided by the HOLLOWVOX community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="action-fund" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="action-fund">$ACTION Fund</TabsTrigger>
                <TabsTrigger value="impact-fund">Impact Fund</TabsTrigger>
              </TabsList>

              <TabsContent value="action-fund" className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : pastActionPurchases.length > 0 ? (
                  <div className="space-y-6">
                    {pastActionPurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 rounded-lg gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <CheckCircle className="h-8 w-8 text-green-400 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-lg">{purchase.recipient}</div>
                            <div className="text-sm text-muted-foreground">{purchase.month}</div>
                            <div className="text-sm text-green-400 mt-1">{purchase.impact}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">${purchase.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">$ACTION purchased</div>
                        </div>
                      </div>
                    ))}

                    <div className="text-center p-6 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-2">
                        ${totalActionPurchased.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">Total $ACTION Tokens Purchased</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-orbitron text-xl font-bold mb-2">$ACTION Fund Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We're preparing to make our first $ACTION token purchases for community giveaways. Check back soon
                      to see our impact on the ACTIONverse!
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="impact-fund" className="space-y-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : pastDonations.length > 0 ? (
                  <div className="space-y-6">
                    {pastDonations.map((donation) => (
                      <div
                        key={donation.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/20 rounded-lg gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <Heart className="h-8 w-8 text-pink-400 flex-shrink-0" />
                          <div>
                            <div className="font-semibold text-lg">{donation.recipient}</div>
                            <div className="text-sm text-muted-foreground">{donation.month}</div>
                            <div className="text-sm text-pink-400 mt-1">{donation.impact}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-pink-400">${donation.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">donated</div>
                        </div>
                      </div>
                    ))}

                    <div className="text-center p-6 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                      <div className="text-3xl font-bold text-pink-400 mb-2">${totalDonated.toLocaleString()}</div>
                      <div className="text-muted-foreground">Total Impact Fund Donations</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-orbitron text-xl font-bold mb-2">Impact Fund Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We're preparing to make our first charitable donations through the Impact Fund. The community will
                      vote on worthy causes to support!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl">How Our Action Token Commitment Works</CardTitle>
            <CardDescription>Transparent, community-driven impact every month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  $ACTION Fund (10%)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 10% of all profits used to purchase $ACTION tokens</li>
                  <li>• Tokens distributed through community giveaways</li>
                  <li>• Supports creators and builders in the ACTIONverse</li>
                  <li>• Community votes on distribution methods</li>
                  <li>• Strengthens the broader Action Tokens ecosystem</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-400" />
                  Impact Fund (10%)
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 10% of all profits donated to charitable causes</li>
                  <li>• Monthly community voting on recipient organizations</li>
                  <li>• Focus on youth programs, mental health, animal rescue</li>
                  <li>• Disaster relief and emergency response support</li>
                  <li>• Transparent reporting on all donations made</li>
                </ul>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-6">
              <h4 className="font-semibold mb-3">Revenue Sources</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">Token Sales</div>
                  <div className="text-muted-foreground">HOLLOWVOX trading</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Partnerships</div>
                  <div className="text-muted-foreground">Strategic collaborations</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Merchandise</div>
                  <div className="text-muted-foreground">Community products</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">Services</div>
                  <div className="text-muted-foreground">Platform features</div>
                </div>
              </div>
            </div>

            <Alert className="border-primary/50 bg-primary/10">
              <Target className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary-foreground/90">
                <strong>Transparency Promise:</strong> All fund allocations, purchases, and donations are tracked and
                reported publicly. The community can verify every transaction and vote on every distribution.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
