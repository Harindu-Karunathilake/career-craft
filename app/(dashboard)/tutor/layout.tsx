import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tutor Workspace | Career Craft",
  description: "Manage your courses, students, and professional profile.",
}


import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { TutorSidebar } from "@/components/dashboard/tutor-sidebar"
import { DashboardHeaderActions } from "@/components/dashboard/dashboard-header-actions"
import { RoleGuard } from "@/components/auth/role-guard"
import { GlobalBackground } from "@/components/ui/global-background"

export default function TutorDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["tutor"]}>
      <SidebarProvider className="tutor-dashboard-theme bg-black relative overflow-x-hidden">
        <GlobalBackground />
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
        <SidebarInset className="bg-transparent text-white relative z-10 w-full">
          <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/40 backdrop-blur-xl px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Tutor Dashboard</p>
                <p className="text-lg font-semibold text-white">Course Management</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 text-xs text-white/60">
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
