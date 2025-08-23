import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Vote, Globe, Target, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export function ActionTokenSection() {
  return (
    <section className="py-12 md:py-24">
      <div className="text-center mb-12">
        <Badge variant="outline" className="border-primary text-primary text-lg px-4 py-2 mb-4">
          <Globe className="h-4 w-4 mr-2" />
          Part of the ACTIONverse
        </Badge>
        <h2 className="font-orbitron text-3xl font-bold md:text-4xl mb-4">
          HOLLOWVOX is an <span className="text-primary">Action Token</span>
        </h2>
        <p className="mx-auto max-w-3xl text-lg text-muted-foreground">Built on purpose. Backed by community.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/10 via-card/50 to-secondary/10 backdrop-blur-sm border-primary/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="font-orbitron text-2xl md:text-3xl">
              We don't just hold the token...
              <br />
              <span className="text-primary">We move the world forward.</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                $HOLLOWVOX isn't just a meme — it's an Action Token, which means we're committed to doing real good,
                every single month.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-card/50 rounded-lg border border-primary/20">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-orbitron text-xl font-bold mb-2">Our Pledge</h3>
                <p className="text-muted-foreground">
                  <span className="text-primary font-bold">20%</span> of all HOLLOWVOX profits committed to good - 10%
                  for $ACTION token purchases and 10% for Impact Fund donations
                </p>
              </div>

              <div className="text-center p-6 bg-card/50 rounded-lg border border-primary/20">
                <Vote className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-orbitron text-xl font-bold mb-2">Community Choice</h3>
                <p className="text-muted-foreground">
                  Token holders vote each month on both $ACTION token distributions and Impact Fund recipients
                </p>
              </div>

              <div className="text-center p-6 bg-card/50 rounded-lg border border-primary/20">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-orbitron text-xl font-bold mb-2">Real Impact</h3>
                <p className="text-muted-foreground">
                  ACTIONverse support + youth programs, mental health, animal rescue, disaster relief — you direct the
                  impact
                </p>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">How It Works:</h4>
                  <ul className="text-muted-foreground space-y-1 text-sm">
                    <li>• Revenue from token sales, partnerships, merch, and all activities</li>
                    <li>• 10% automatically allocated to monthly $ACTION token fund</li>
                    <li>• 10% automatically allocated to monthly Impact Fund</li>
                    <li>• Community votes on both fund distributions</li>
                    <li>• Transparent reporting on all purchases and donations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button asChild size="lg" className="font-bold">
                <Link href="/action-token" className="flex items-center gap-2">
                  Learn More About Our Impact
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
