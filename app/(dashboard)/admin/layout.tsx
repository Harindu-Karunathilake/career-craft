import type { ReactNode } from "react"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/dashboard/admin-sidebar"
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions"

export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-black text-white">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-white" />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Admin dashboard</p>
              <p className="text-lg font-semibold">System overview</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-xs text-white/60">
            <p>Data refreshed 2 min ago</p>
            <DashboardHeaderActions />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-8 px-6 py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
