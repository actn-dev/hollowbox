"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type FreighterApi = {
  isAllowed?: () => Promise<boolean>
  isConnected?: () => Promise<boolean>
  getPublicKey?: () => Promise<string>
  signTransaction?: (xdr: string, opts?: { network?: string }) => Promise<string>
}

declare global {
  interface Window {
    freighterApi?: FreighterApi
    freighter?: FreighterApi
    stellar?: { freighter?: FreighterApi }
  }
}

function getFreighterApi(): FreighterApi | null {
  if (typeof window === "undefined") return null
  return window.freighterApi || (window as any).freighter || (window as any).stellar?.freighter || null
}

function isEmbeddedPreview() {
  if (typeof window === "undefined") return false
  const inIframe = window.parent && window.parent !== window
  const isV0Host = window.location.hostname.includes("v0.dev")
  return inIframe || isV0Host
}

async function waitForFreighter(timeoutMs = 8000, intervalMs = 200): Promise<FreighterApi | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const api = getFreighterApi()
    if (api?.getPublicKey || api?.isAllowed || api?.isConnected) return api
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  return null
}

export default function FreighterDiagnostics() {
  const [env, setEnv] = useState({
    embedded: false,
    host: "",
    hasApi: false,
    methods: { isAllowed: false, isConnected: false, getPublicKey: false },
  })
  const [result, setResult] = useState<string>("")
  const baseUrl = useMemo(() => process.env.NEXT_PUBLIC_BASE_URL || "", [])

  useEffect(() => {
    const api = getFreighterApi()
    setEnv({
      embedded: isEmbeddedPreview(),
      host: typeof window !== "undefined" ? window.location.hostname : "",
      hasApi: !!api,
      methods: {
        isAllowed: !!api?.isAllowed,
        isConnected: !!api?.isConnected,
        getPublicKey: !!api?.getPublicKey,
      },
    })
  }, [])

  const testFreighter = async () => {
    setResult("Testing...")
    const api = await waitForFreighter()
    if (!api) {
      setResult(
        "Freighter API not detected. If you’re viewing inside the v0 preview, open the app in a new tab or deployed domain and try again."
      )
      return
    }

    try {
      if (api.isAllowed) {
        const allowed = await api.isAllowed()
        if (!allowed) {
          setResult("Freighter detected but access is not allowed. Open your Freighter extension and allow the site.")
          return
        }
      }
      const key = api.getPublicKey ? await api.getPublicKey() : undefined
      setResult(key ? `Success! Public Key: ${key}` : "Freighter detected, but getPublicKey() is not available")
    } catch (e: any) {
      setResult(`Freighter call failed: ${e?.message || e}`)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-orbitron">Freighter Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc pl-5 text-sm">
            <li>Host: {env.host}</li>
            <li>Embedded/Preview: {env.embedded ? "Yes" : "No"}</li>
            <li>Freighter API detected: {env.hasApi ? "Yes" : "No"}</li>
            <li>Methods: isAllowed({String(env.methods.isAllowed)}), isConnected({String(env.methods.isConnected)}), getPublicKey({String(env.methods.getPublicKey)})</li>
          </ul>

          <div className="flex gap-2">
            <Button onClick={testFreighter}>Run Freighter Test</Button>
            {baseUrl ? (
              <a href={baseUrl} target="_blank" rel="noreferrer">
                <Button variant="outline">Open App in New Tab</Button>
              </a>
            ) : null}
          </div>

          {result && <div className="text-sm text-muted-foreground">{result}</div>}

          <p className="text-xs text-muted-foreground">
            If this page shows Embedded/Preview: Yes and API not detected, extensions are likely blocked by the iframe. Open in a new tab or your deployed domain and try again.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
