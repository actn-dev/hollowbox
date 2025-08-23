import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LorePage() {
  return (
    <div className="py-12 md:py-16">
      <div className="text-center">
        <h1 className="font-orbitron text-4xl font-bold md:text-5xl">The Lore of The Hollow</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground font-semibold text-lg">(Based on True Events)</p>
      </div>

      <div className="mt-12 grid gap-8">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl text-primary">Chapter 1: The Spark – 2021</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              In the midst of a shifting world, a creative force named Jose Urquiza launched a quiet rebellion: Action
              Tokens. Born in 2021, the mission was clear—build a platform where taking action in the real world could
              be verified, celebrated, and rewarded using blockchain. It began as an idea in a studio in the Midwest and
              grew into a movement focused on creativity, accountability, and community empowerment.
            </p>
            <p className="font-semibold text-foreground">This wasn't about hype. It was about purpose.</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl text-primary">Chapter 2: Enter HOLLOWVOX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              While building Action Tokens, a symbolic force emerged—$HOLLOWVOX. It started as an experiment, but
              quickly evolved into something deeper. Minted on Stellar and later on BandCoin and Lu.Meme, $HOLLOWVOX was
              never just a token—it became a voice. A digital identity that reflected those who felt unseen in a system
              built for the loudest.
            </p>
            <p className="font-semibold text-foreground">
              $HOLLOWVOX stood for those who had something real to say—and were ready to be heard.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl text-primary">Chapter 3: The Awakening</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              As the community grew, so did the infrastructure. Platforms like BandTogether and ActionTokens began to
              sync with the Hollowvox vision. Utilities were added. Wallets became access keys. Holder tiers became
              experiences. Every step was built by hand—with intention, not illusion.
            </p>
            <p className="font-semibold text-foreground">
              Real value was being created—not just in charts, but in the lives of builders, fans, and creatives who
              chose to participate.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl text-primary">Chapter 4: A New Kind of Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>$HOLLOWVOX became the prototype for a different kind of asset: an Action Token.</p>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary font-bold">📜</span>
                Each month, 10% of all profits are committed to a cause, charity, or community need—voted on by the
                holders themselves.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary font-bold">🎤</span>
                This wasn't just about holding value. It was about deciding what value means—and putting it into motion.
              </p>
            </div>
            <p className="font-semibold text-foreground">
              The token became a tool for collective direction. A signal of shared intention. A new kind of voice in a
              decentralized world.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-orbitron text-2xl text-primary">Chapter 5: The Hollowers Rise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Today, Hollowers aren't just spectators. They're part of something living. Each transaction, each vote,
              each new holder adds to a growing network of action-minded people committed to making the digital world
              more real.
            </p>
            <div className="text-center py-6 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-lg border border-primary/30">
              <p className="font-bold text-foreground text-lg mb-2">This isn't just lore.</p>
              <p className="font-bold text-primary text-xl mb-4">This is your invitation.</p>
              <p className="font-orbitron text-2xl font-bold text-primary">Welcome to The Hollow.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
