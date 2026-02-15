import type { ReactNode } from "react"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { TutorSidebar } from "@/components/dashboard/tutor-sidebar"
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions"
import { RoleGuard } from "@/components/auth/role-guard"

export default function TutorDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["tutor"]}>
      <SidebarProvider className="tutor-dashboard-theme">
        <style dangerouslySetInnerHTML={{ __html: `
          .tutor-dashboard-theme {
            --primary: oklch(0.623 0.17 150);
            --ring: oklch(0.623 0.17 150);
            --sidebar-primary: oklch(0.623 0.17 150);
            --sidebar-ring: oklch(0.623 0.17 150);
          }
          .dark .tutor-dashboard-theme {
            --primary: oklch(0.623 0.17 150);
            --ring: oklch(0.623 0.17 150);
            --sidebar-primary: oklch(0.623 0.17 150);
            --sidebar-ring: oklch(0.623 0.17 150);
          }
        `}} />
        <TutorSidebar />
        <SidebarInset className="bg-background text-foreground">
          <header className="sticky top-0 z-10 glass flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Tutor Dashboard</p>
                <p className="text-lg font-semibold">Course Management</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 text-xs text-muted-foreground">
              <p>Ready to teach?</p>
              <DashboardHeaderActions />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-8 px-6 py-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  )
}
