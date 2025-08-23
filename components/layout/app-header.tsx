"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from 'lucide-react'
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button"
import Image from "next/image"

const navigation = [
  { name: "The Hollow", href: "/" },
  { name: "Projects", href: "/my-projects" },
  { name: "Tracker", href: "/tracker" },
  { name: "Rewards", href: "/rewards" },
  { name: "Claim", href: "/claim" },
  { name: "Action Token", href: "/action-token" },
]

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Image src="/images/hollowvox-logo.png" alt="HOLLOWVOX" width={32} height={32} className="rounded-full" />
              <span className="hidden font-bold sm:inline-block font-orbitron">HOLLOWVOX</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors hover:text-foreground/80 ${
                    pathname === item.href ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <div className="flex items-center space-x-2 mb-6">
                <Image src="/images/hollowvox-logo.png" alt="HOLLOWVOX" width={24} height={24} className="rounded-full" />
                <span className="font-bold font-orbitron">HOLLOWVOX</span>
              </div>
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`transition-colors hover:text-foreground/80 ${
                      pathname === item.href ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Link href="/" className="flex items-center space-x-2 md:hidden">
                <Image src="/images/hollowvox-logo.png" alt="HOLLOWVOX" width={24} height={24} className="rounded-full" />
                <span className="font-bold font-orbitron">HOLLOWVOX</span>
              </Link>
            </div>
            <nav className="flex items-center">
              <WalletConnectButton />
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
