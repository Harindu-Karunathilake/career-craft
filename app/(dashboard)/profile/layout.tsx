import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Profile | Career Craft",
  description: "View your earned badges, career XP, and professional achievements.",
}

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/dashboard/user-sidebar"
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions"
import { GlobalBackground } from "@/components/ui/global-background"

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="user-dashboard-theme bg-black relative overflow-x-hidden">
      <GlobalBackground />
      <style dangerouslySetInnerHTML={{ __html: `
        .user-dashboard-theme {
          --primary: oklch(0.623 0.17 290);
          --ring: oklch(0.623 0.17 290);
          --sidebar-primary: oklch(0.623 0.17 290);
          --sidebar-ring: oklch(0.623 0.17 290);
        }
      `}} />
      <UserSidebar />
      <SidebarInset className="bg-transparent text-white relative z-10 w-full">
        <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2" />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Account</p>
              <p className="text-lg font-semibold text-white">My Profile</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-xs text-white/60">
            <p>Badges & XP</p>
            <DashboardHeaderActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-8 px-6 py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
