import { Card, CardContent } from "@/components/ui/card"
import { Star } from 'lucide-react'
import { ProjectsGrid } from "@/components/projects-grid"

export default function MyProjectsPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background to-muted/20"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontWeight: 400,
        letterSpacing: "normal",
      }}
    >
      {/* Hero Section */}
      <section className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500" />
            <span className="text-lg font-medium text-muted-foreground">My Projects</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Building the Future
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A selection of platforms, products, and creative works I've helped bring to life.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold mb-1">11+</div>
                <div className="text-sm text-muted-foreground">Projects Launched</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <ProjectsGrid />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-0">
              <h2 className="text-3xl font-bold mb-4">Let's Build Something Amazing</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Interested in collaborating on your next project? I'd love to help bring your ideas to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:hello@yourdomain.com" className="inline-flex">
                  <button className="inline-flex items-center justify-center h-10 rounded-md bg-primary px-8 text-primary-foreground hover:bg-primary/90 transition">
                    Start a Conversation
                  </button>
                </a>
                <a href="/my-projects" className="inline-flex">
                  <button className="inline-flex items-center justify-center h-10 rounded-md border px-8 hover:bg-muted transition">
                    View More Work
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
