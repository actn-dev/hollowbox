import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Gift, BadgeCheck, Coins, Radar, Shield, FolderKanban, Ticket, ArrowRight } from 'lucide-react'

type Project = {
  title: string
  description: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  cta?: string
}

const projects: Project[] = [
  {
    title: "Tracker",
    description: "Live market overview and $HOLLOWVOX metrics.",
    href: "/tracker",
    icon: Activity,
    cta: "Open Tracker",
  },
  {
    title: "Rewards",
    description: "See your tier and available HOLLOWVOX rewards.",
    href: "/rewards",
    icon: Gift,
    cta: "View Rewards",
  },
  {
    title: "Claim",
    description: "Enter drawings and claim eligible rewards.",
    href: "/claim",
    icon: BadgeCheck,
    cta: "Go to Claim",
  },
  {
    title: "Action Token",
    description: "Track donations and impact from Action Token.",
    href: "/action-token",
    icon: Coins,
    cta: "Explore",
  },
  {
    title: "Signal Hunt",
    description: "Play, earn, and climb the leaderboard.",
    href: "/signal-hunt",
    icon: Radar,
    cta: "Start Hunting",
  },
  {
    title: "Guardian",
    description: "Guardian tools and dashboards.",
    href: "/guardian",
    icon: Shield,
    cta: "Open Guardian",
  },
  {
    title: "Projects",
    description: "Browse current community initiatives.",
    href: "/my-projects",
    icon: FolderKanban,
    cta: "Browse",
  },
  {
    title: "Raffle",
    description: "Participate in seasonal raffles and giveaways.",
    href: "/raffle",
    icon: Ticket,
    cta: "Enter Raffle",
  },
]

export function HomeProjects() {
  return (
    <section className="py-12 md:py-20 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 text-center md:mb-12 max-w-2xl">
          <h2 className="font-orbitron text-3xl font-bold md:text-4xl">Projects</h2>
          <p className="mt-3 text-muted-foreground">
            Jump into the core experiences across the Hollow. Your access may vary based on your tier.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((p) => {
            const Icon = p.icon
            return (
              <Card
                key={p.title}
                className="group relative overflow-hidden border-muted/50 transition hover:shadow-md"
              >
                <CardHeader className="relative">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-foreground/10 p-2 text-foreground">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="font-orbitron text-lg">{p.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <Button asChild variant="secondary" className="font-semibold">
                      <Link href={p.href} aria-label={`Open ${p.title}`}>
                        {p.cta ?? "Open"} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    <Link
                      className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      href={p.href}
                      aria-label={`Learn more about ${p.title}`}
                    >
                      Learn more
                    </Link>
                  </div>
                  <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(3,255,118,0.25),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeProjects
