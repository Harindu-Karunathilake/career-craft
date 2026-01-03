import type { ReactNode } from "react"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/dashboard/user-sidebar"
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions"

export default function UserDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset className="bg-background text-foreground">
        <header className="sticky top-0 z-10 glass flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2" />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Dashboard</p>
              <p className="text-lg font-semibold">Career progress</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-xs text-muted-foreground">
            <p>Last synced moments ago</p>
            <DashboardHeaderActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-8 px-6 py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
