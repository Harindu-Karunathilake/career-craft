import { SiteNavbar } from "@/components/home/navbar"
import { SiteFooter } from "@/components/site-footer"

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNavbar />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
