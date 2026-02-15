import { SiteNavbar } from "@/components/home/navbar"
import { SiteFooter } from "@/components/site-footer"
import { GlobalBackground } from "@/components/ui/global-background"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black font-sans relative overflow-x-hidden">
      <GlobalBackground />
      <SiteNavbar />
      <div className="flex-1 relative z-10">{children}</div>
      <SiteFooter />
    </div>
  )
}
