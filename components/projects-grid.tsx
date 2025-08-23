import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Zap, Music, Coins, Star, Users, Smartphone, Code, Settings, Headphones, Mic, Globe } from 'lucide-react'
import React from "react"

export type ProjectItem = {
  title: string
  description: string
  impact: string
  category: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  url?: string
  technologies: string[]
}

export const allProjects: ProjectItem[] = [
  {
    title: "3 Years Hollow",
    description: "A nationally touring rock band with Billboard-charting singles and over 50,000 monthly listeners.",
    impact:
      "Toured across the U.S., performed at major rock festivals, and built a dedicated fanbase through music and fan engagement initiatives.",
    category: "Music",
    icon: Music,
    url: "https://3yearshollow.com",
    technologies: ["Music", "Touring", "Fan Engagement"],
  },
  {
    title: "ActionTokens",
    description:
      "A blockchain-powered rewards system that tracks real-world actions and issues tokens based on contributions.",
    impact:
      "Used in live campaigns for events, creators, and community challenges; expanding through partner modules for creators and businesses.",
    category: "Blockchain",
    icon: Zap,
    url: "https://action-tokens.com",
    technologies: ["Blockchain", "Rewards", "Community"],
  },
  {
    title: "ActionWorks AI Portal",
    description:
      "A centralized AI assistant that connects to company tools like Google Drive, Salesforce, and Zendesk to surface insights, answer questions, and automate workflows.",
    impact: "Reduced support volume by over 50% while improving team knowledge access and operational speed.",
    category: "AI Platform",
    icon: Zap,
    url: "https://actn.xyz",
    technologies: ["AI", "Integrations", "Automation"],
  },
  {
    title: "BandCoin",
    description:
      "A blockchain platform connecting artists and fans through tokenized music experiences and digital collectibles.",
    impact: "Created a new model for artist-fan interaction through blockchain technology and digital ownership.",
    category: "Blockchain",
    icon: Coins,
    url: "https://bandcoin.io",
    technologies: ["Blockchain", "Tokens", "Music"],
  },
  {
    title: "BandCoin Showcase",
    description:
      "A custom app and web creator platform for music artists, bands, and creators. Build custom websites, mobile apps, and electronic press kits (EPKs) with specialized tools for the music industry.",
    impact:
      "Empowered artists to create professional digital presences without technical expertise, enabling custom branding and fan engagement through tailored web and mobile experiences.",
    category: "Creator Platform",
    icon: Globe,
    url: "https://showcase.bandcoin.io",
    technologies: ["Web Development", "Mobile Apps", "EPKs", "Music Industry"],
  },
  {
    title: "Band Together",
    description:
      "A platform that brings musicians and fans together through collaborative experiences and community building.",
    impact: "Fostered connections between artists and audiences through innovative engagement tools.",
    category: "Community",
    icon: Users,
    url: "https://bandtogether.io",
    technologies: ["Community", "Music", "Collaboration"],
  },
  {
    title: "Code Junkyard",
    description:
      "A developer resource platform featuring code snippets, tutorials, and tools for programmers and developers.",
    impact: "Provided valuable resources and code examples to help developers solve common programming challenges.",
    category: "Developer Tools",
    icon: Code,
    url: "https://codejunkyard.com",
    technologies: ["Web Development", "Code Snippets", "Tutorials"],
  },
  {
    title: "Instamix Live",
    description:
      "An immersive music experience where fans join their favorite artists for real-time, collaborative studio sessions—writing, producing, and listening together over 4–8 hours. Sessions are hosted in studios, homes, venues, or pop-up locations, turning the creative process into a live event. Hosted sessions with Lajon Witherspoon and John Connolly of Sevendust, Bumblefoot, Morgan Rose (Sevendust), Shaun Foist (Breaking Benjamin), Barry Stock (Three Days Grace), Aaron Nordstrom (Gemini Syndrome), and Jason Christopher (Prong).",
    impact: "Built deeper artist-fan connections and pioneered a new format for experiential music creation.",
    category: "Music Experience",
    icon: Headphones,
    url: "https://instamix.live",
    technologies: ["Live Streaming", "Music Production", "Community"],
  },
  {
    title: "ORCA Protocol",
    description:
      "Omni Remote Control Assistant - A comprehensive remote control and automation protocol for managing devices and systems.",
    impact: "Streamlined device management and automation workflows for technical users and system administrators.",
    category: "Automation",
    icon: Settings,
    technologies: ["Automation", "Remote Control", "Protocol"],
  },
  {
    title: "Tello App",
    description:
      "A mobile app to help users discover and share fun things to do in their area—built collaboratively as a learning project with my 11-year-old son.",
    impact: "A hands-on lesson in product development, community-building, and coding.",
    category: "Mobile App",
    icon: Smartphone,
    technologies: ["Mobile", "Discovery", "Family Project"],
  },
  {
    title: "The Attic Recording Studios",
    description:
      "A boutique recording studio in Geneseo, IL known for its warm, creative atmosphere and high-end production quality. Hosted sessions with Bumblefoot, Morgan Rose (Sevendust), Shaun Foist (Breaking Benjamin), Barry Stock (Three Days Grace), Aaron Nordstrom (Gemini Syndrome), and Jason Christopher (Prong).",
    impact: "Became a Midwest destination for major artists and exclusive Instamix Live events.",
    category: "Recording Studio",
    icon: Mic,
    technologies: ["Music Production", "Recording", "Artist Development"],
  },
]

export type ProjectsGridProps = {
  maxItems?: number
}

export function ProjectsGrid({ maxItems }: ProjectsGridProps = { maxItems: undefined }) {
  const items = typeof maxItems === "number" ? allProjects.slice(0, maxItems) : allProjects

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map((project, index) => (
        <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <project.icon className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary" className="text-xs">
                {project.category}
              </Badge>
            </div>
            <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">{project.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{project.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm font-medium text-green-600 mb-2">Impact:</p>
              <p className="text-sm text-muted-foreground">{project.impact}</p>
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {project.technologies.map((tech, techIndex) => (
                <Badge key={techIndex} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
            {project.url && (
              <Link href={project.url} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                >
                  Visit Project
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default ProjectsGrid
