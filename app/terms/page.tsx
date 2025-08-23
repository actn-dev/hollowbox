import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TermsPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-orbitron text-4xl font-bold md:text-5xl mb-4">Terms of Use & Legal Disclaimers</h1>
          <p className="text-muted-foreground">Last updated: July 9, 2025</p>
        </div>

        <Alert className="mb-8 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            <strong>Important:</strong> Please read these terms carefully before using The Hollow or interacting with
            HOLLOWVOX tokens. By connecting your wallet and using this platform, you agree to these terms.
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">1.</span> General Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                HOLLOWVOX is a digital access token used to unlock certain features and experiences within the Hollowvox
                ecosystem. These may include exclusive content, digital rewards, community roles, and token-gated
                booking access to real-world assets ("Perks"), such as community-sponsored accommodations or events.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">2.</span> Not an Investment or Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>HOLLOWVOX is not a financial product, security, investment contract, or equity.</li>
                <li>
                  Holding HOLLOWVOX does not entitle you to profits, dividends, or ownership in any entity or property.
                </li>
                <li>
                  HOLLOWVOX exists solely to provide access to features, content, or experiences curated by the
                  community or administrators.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">3.</span> Real-World Asset Access (RWA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  Some Perks may include access to physical spaces or services (e.g., booking time at a
                  community-managed apartment).
                </li>
                <li>These assets are not fractionalized, tokenized, or owned by HOLLOWVOX holders.</li>
                <li>
                  Access is granted at the discretion of the administrators and may be subject to availability,
                  maintenance, local laws, or other external factors.
                </li>
                <li>
                  You may be required to complete additional steps (e.g., ID verification, booking agreements) before
                  access is granted.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">4.</span> Eligibility & Token Gating
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  Access to features or perks is based on wallet balance and other activity, determined at the time of
                  access.
                </li>
                <li>
                  We reserve the right to change eligibility thresholds, revoke access, or update gating rules at any
                  time to ensure fair usage and legal compliance.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">5.</span> No Guarantees or Promises
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  HOLLOWVOX makes no guarantees regarding the value, utility, availability, or continuity of any token,
                  service, or perk.
                </li>
                <li>The project is experimental and subject to change without notice.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">6.</span> No Custody, No Trading Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>This platform does not custody funds, hold tokens on your behalf, or provide exchange services.</li>
                <li>All actions (including wallet connection and interaction) are non-custodial and user-initiated.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">7.</span> User Responsibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>You are responsible for safeguarding your wallet and private keys.</li>
                <li>
                  Use of the platform is at your own risk, and you agree not to hold HOLLOWVOX, its creators, or
                  contributors liable for any loss of assets, opportunity, or damages.
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">8.</span> Compliance and Lawful Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  You agree to only use the platform in compliance with local, national, and international laws,
                  including anti-money laundering (AML) and sanctions compliance.
                </li>
                <li>We reserve the right to deny access to individuals or jurisdictions prohibited under U.S. law.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">9.</span> Updates and Modifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                These terms may be updated at any time without notice. Continued use of the platform signifies your
                agreement to the latest version.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-orbitron text-2xl text-primary flex items-center gap-2">
                <span className="text-primary">10.</span> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>For inquiries or to report misuse:</p>
              <div className="flex items-center gap-2 text-primary">
                <Mail className="h-4 w-4" />
                <a href="mailto:jose@action-tokens.com" className="hover:underline">
                  jose@action-tokens.com
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        <div className="text-center text-sm text-muted-foreground">
          <p>
            By connecting your wallet and using The Hollow platform, you acknowledge that you have read, understood, and
            agree to be bound by these Terms of Use.
          </p>
        </div>
      </div>
    </div>
  )
}
