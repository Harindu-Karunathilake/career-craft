import Link from "next/link"

import { socialLinks } from "@/data/contact"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

const footerLinks = [
  { label: "Product", href: "#plans" },
  { label: "Interviews", href: "/interviews" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "#contact" },
]

export function SiteFooter() {
  return (
    <footer className="bg-black border-t border-white/20 relative z-50 px-6 pb-10 pt-16 text-muted-foreground sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">CareerCraft</p>
            <p className="text-sm">
              Collaborative tooling for ambitious candidates and the mentors who champion them.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-medium">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <Separator className="bg-border" decorative />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80">Stay connected</div>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <Button
                key={link.platform}
                asChild
                variant="outline"
                size="sm"
                className="bg-background/50 hover:bg-background hover:text-primary"
              >
                <Link href={link.href} target="_blank" rel="noreferrer">
                  {link.platform}
                  <span className="ml-2 text-muted-foreground">{link.handle}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CareerCraft. All rights reserved.</p>
          <div className="flex gap-3">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
