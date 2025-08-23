"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface StellarExpertWidgetProps {
  assetCode: string
  issuerAddress: string
  issuerName: string
  issuerColor: string
  stellarExpertUrl: string
}

export function StellarExpertWidget({
  assetCode,
  issuerAddress,
  issuerName,
  issuerColor,
  stellarExpertUrl,
}: StellarExpertWidgetProps) {
  const widgetSrc = `https://stellar.expert/widget/public/asset/price/${assetCode}-${issuerAddress}`

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="font-orbitron text-lg">{issuerName} Live Price Chart</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" style={{ borderColor: issuerColor, color: issuerColor }}>
              {assetCode}
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
              <a href={stellarExpertUrl} target="_blank" rel="noopener noreferrer" title="View on StellarExpert">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <CardDescription className="font-mono text-xs break-all sm:break-normal">
          <span className="sm:hidden">{issuerAddress}</span>
          <span className="hidden sm:inline">
            {issuerAddress.slice(0, 8)}...{issuerAddress.slice(-8)}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <iframe
            src={widgetSrc}
            style={{
              border: "none",
              overflow: "hidden",
              maxWidth: "100%",
              minWidth: "300px",
              maxHeight: "100%",
              minHeight: "200px",
              width: "100%",
              height: "400px",
            }}
            onLoad={(e) => {
              const iframe = e.target as HTMLIFrameElement
              window.addEventListener(
                "message",
                ({ data, source }) => {
                  if (iframe && source === iframe.contentWindow && data.widget === iframe.src) {
                    iframe.style.height = data.height + "px"
                  }
                },
                false,
              )
            }}
            title={`${issuerName} Price Chart`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
