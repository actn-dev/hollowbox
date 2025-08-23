import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Reward } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RewardCardProps {
  reward: Reward
  userTier: number
}

const tierColors = {
  1: "border-cyan-400 text-cyan-400",
  2: "border-fuchsia-400 text-fuchsia-400",
  3: "border-amber-400 text-amber-400",
}

const typeBadges = {
  digital: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  physical: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  rwa: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
}

export function RewardCard({ reward, userTier }: RewardCardProps) {
  const isEligible = userTier >= reward.tierRequired

  return (
    <Card className="flex flex-col bg-card/50 backdrop-blur-sm transition-all hover:border-primary/60">
      <CardHeader>
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-md">
          <Image src={reward.imageUrl || "/placeholder.svg"} alt={reward.title} fill className="object-cover" />
        </div>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-orbitron text-xl">{reward.title}</CardTitle>
          <Badge variant="outline" className={cn(tierColors[reward.tierRequired])}>
            Tier {reward.tierRequired}
          </Badge>
        </div>
        <CardDescription>{reward.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Badge variant="outline" className={cn("capitalize", typeBadges[reward.type])}>
            {reward.type}
          </Badge>
          {reward.redemptionsLeft !== null && <span>{reward.redemptionsLeft} left</span>}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full font-bold" disabled={!isEligible}>
          {isEligible ? (reward.type === "rwa" ? "Book Now" : "Claim Reward") : "Tier Not Met"}
        </Button>
      </CardFooter>
    </Card>
  )
}
