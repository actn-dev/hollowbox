import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Mail, Eye, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PrivacyPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: July 9, 2025</p>
        </div>

        <Alert className="mb-8 border-primary/50 bg-primary/10">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary-foreground/90">
            <strong>Privacy-First:</strong> HOLLOWVOX is built to be non-custodial, privacy-preserving, and
            wallet-native. We collect minimal data and never store your private keys.
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">1.</span> Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                This Privacy Policy describes how HOLLOWVOX ("we", "our", or "the project") collects, uses, and protects
                information when you interact with the Hollowvox ecosystem, including our website and token-gated
                services.
              </p>
              <p>
                We are committed to respecting your privacy and keeping your data safe. The HOLLOWVOX platform is built
                to be non-custodial, privacy-preserving, and wallet-native.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <Eye className="h-6 w-6" />
                <span className="text-primary">2.</span> What We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We collect the minimum amount of information necessary to operate the platform:</p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Public blockchain data:</h4>
                  <p>
                    We read publicly available information from the Stellar blockchain, including wallet addresses and
                    token balances.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Wallet connection events:</h4>
                  <p>When you connect your Stellar wallet, we log your address and interaction timestamp.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Optional info for real-world perks:</h4>
                  <p>
                    If you claim a physical reward or book a real-world asset (like a community timeshare), we may
                    collect:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                    <li>Email address</li>
                    <li>Name</li>
                    <li>Shipping or booking details</li>
                    <li>ID verification (only if required for access control)</li>
                  </ul>
                </div>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-6">
                <p className="text-destructive font-semibold">
                  We do not collect private keys, passwords, or wallet recovery information under any circumstances.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">3.</span> How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We use collected information to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Authenticate access to gated perks and content</li>
                <li>Verify token holdings for eligibility</li>
                <li>Enable booking and coordination of real-world asset access (if applicable)</li>
                <li>Prevent abuse or fraud (e.g., bot access or duplicate reward claims)</li>
                <li>Improve the experience and usability of the platform</li>
              </ul>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-6">
                <p className="text-primary font-semibold">
                  We do not sell or share your personal data with third parties for advertising or analytics.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">4.</span> Cookies and Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We may use minimal cookies or local storage to improve functionality, such as:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Remembering your connected wallet</li>
                <li>Tracking session activity anonymously</li>
              </ul>
              <p className="mt-4">
                We do not use third-party trackers (e.g., Google Analytics, Facebook Pixel) by default.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">5.</span> Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Depending on your region (e.g., U.S., EU), you have the right to:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Request access to or deletion of any personal data you've shared</li>
                <li>Opt out of communications (if any)</li>
                <li>Request correction of inaccurate information</li>
              </ul>
              <div className="bg-muted/50 border rounded-lg p-4 mt-6">
                <p className="text-foreground">
                  To request data access or deletion, email{" "}
                  <a href="mailto:jose@action-tokens.com" className="text-primary hover:underline font-semibold">
                    jose@action-tokens.com
                  </a>{" "}
                  with the subject line: <strong>Privacy Request</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <Lock className="h-6 w-6" />
                <span className="text-primary">6.</span> Data Storage and Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                All collected data is stored securely and only accessible by project administrators. We use best
                practices for data encryption, access control, and minimal data retention.
              </p>
              <p>Booking and perk claim information may be deleted periodically after fulfillment.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">7.</span> Third-Party Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                If we integrate with third-party services for booking, delivery, or verification (e.g., Calendly,
                Stripe, ID verification providers), you will be subject to their privacy policies as well.
              </p>
              <p>We only partner with vendors that meet modern data protection standards.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">8.</span> Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We may update this policy to reflect changes in our services, laws, or technology. When we do, we'll
                update the date at the top of this page. We encourage you to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <Mail className="h-6 w-6" />
                <span className="text-primary">9.</span> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>For any questions, concerns, or requests related to privacy, please contact:</p>
              <div className="flex items-center gap-2 text-primary bg-primary/10 border border-primary/20 rounded-lg p-4">
                <Mail className="h-5 w-5" />
                <a href="mailto:jose@action-tokens.com" className="hover:underline font-semibold">
                  jose@action-tokens.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        <div className="text-center text-sm text-muted-foreground">
          <p>
            This privacy policy is designed to be transparent and user-friendly. If you have any questions about how we
            handle your data, please don't hesitate to reach out.
          </p>
        </div>
      </div>
    </div>
  )
}
