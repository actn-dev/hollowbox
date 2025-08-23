import type React from "react"
import type { Metadata } from "next"
import { Inter, Orbitron } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { AppHeader } from "@/components/layout/app-header"
import { AppFooter } from "@/components/layout/app-footer"
import { WalletProvider } from "@/contexts/wallet-context"
import { GlobalSignalCatcher } from "@/components/signal-hunt/global-signal-catcher"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" })

export const metadata: Metadata = {
  title: "The Hollow - HOLLOWVOX HQ",
  description: "The central sanctuary for Hollowers and HOLLOWVOX token holders.",
  icons: {
    icon: "/images/hollowvox-favicon.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, orbitron.variable)}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <div className="relative flex min-h-dvh flex-col bg-background">
              <AppHeader />
              <main className="flex-1 w-full">
                <div className="container mx-auto px-4 max-w-7xl">{children}</div>
              </main>
              <AppFooter />
            </div>
            <GlobalSignalCatcher />
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
