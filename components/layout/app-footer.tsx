import Link from "next/link"

export function AppFooter() {
  return (
    <footer className="border-t border-border/40">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
            <p className="text-sm font-medium text-muted-foreground">
              Powered by ActionTokens & ActionWallet -{" "}
              <a
                href="mailto:admin@action-tokens.com?subject=Custom Experience Inquiry"
                className="text-primary hover:text-primary/80 transition-colors underline"
              >
                Want to build your own custom experience?
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Use
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
