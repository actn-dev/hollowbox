import { Button } from "@/components/ui/button";
import { BalanceChecker } from "@/components/balance-checker";
import { ActionTokenSection } from "@/components/action-token-section";
import { HomeTokenStats } from "@/components/home-token-stats";
import Image from "next/image";
import Link from "next/link";
import { ProjectsGrid } from "@/components/projects-grid";
import { ConnectWallet } from "@/components/wallet-connect";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10">
        <section className="flex min-h-[calc(100dvh-var(--header-height))] flex-col items-center justify-center py-20 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(3,255,118,0.3),rgba(255,255,255,0))] opacity-40" />

          <div className="mb-12 flex items-center justify-center">
            <div className="relative h-24 w-96 sm:h-32 sm:w-[32rem] md:h-40 md:w-[40rem] lg:h-48 lg:w-[48rem]">
              <Image
                src="/images/hollowvox-logo.png"
                alt="HOLLOWVOX"
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
          </div>

          <h1 className="font-orbitron text-5xl font-bold tracking-tighter md:text-7xl lg:text-8xl">
            <span className="holographic-text">THE HOLLOW</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Welcome to The Hollow, the official sanctuary for Hollowers. Access
            exclusive rewards, manage your HOLLOWVOX collectibles, and dive deep
            into the lore. Your journey into the digital frontier starts here.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="font-bold">
              <Link href="/tracker">$HOLLOWVOX Tracker</Link>
            </Button>
          </div>
        </section>

        {/* <ConnectWallet /> */}

        {/* Projects from /my-projects */}
        <section className="py-12 md:py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-8 text-center md:mb-12 max-w-2xl">
              <h2 className="font-orbitron text-3xl font-bold md:text-4xl">
                Projects
              </h2>
              <p className="mt-3 text-muted-foreground">
                A selection of platforms, products, and creative works brought
                to life.
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              <ProjectsGrid maxItems={9} />
            </div>
          </div>
        </section>

        <ActionTokenSection />

        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Disclaimer:</strong> $HOLLOWVOX is a fan-access token
                that provides exclusive access to content, voting, and
                merchandise. From time to time, token holders may receive gifts
                or rewards at the sole discretion of the artist. These rewards
                are not guaranteed, not proportionate to token holdings, and do
                not constitute investment returns.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-orbitron text-3xl font-bold md:text-4xl mb-4">
                HOLLOWVOX Live Statistics
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real-time market data for HOLLOWVOX tokens powered by the
                Stellar network. Data updates every 2 minutes.
              </p>
            </div>
            <HomeTokenStats />
          </div>
        </section>

        <section className="py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-orbitron text-3xl font-bold md:text-4xl">
                Check Your HOLLOWVOX Balance
              </h2>
              <p className="mt-4 text-muted-foreground">
                Enter any Stellar public key to check HOLLOWVOX token holdings
                and Hollower tier status
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <BalanceChecker />
            </div>
          </div>
        </section>
      </div>
      <div className="glitch-overlay pointer-events-none absolute inset-0" />
    </div>
  );
}
