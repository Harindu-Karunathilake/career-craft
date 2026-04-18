"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, FileText, LayoutDashboard, Settings, BookOpen, Wallet, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Overview",
    href: "/tutor",
    icon: LayoutDashboard,
    description: "Tutor dashboard overview",
  },
  {
    title: "Courses",
    href: "/tutor/courses",
    icon: BookOpen,
    description: "Manage your courses",
  },
  {
    title: "Interviews",
    href: "/tutor/interviews",
    icon: Briefcase,
    description: "Interviews & feedback",
  },
  {
    title: "Resume",
    href: "/tutor/resume",
    icon: FileText,
    description: "Resume tools",
  },
  {
    title: "Community",
    href: "/tutor/community",
    icon: Users,
    description: "Browse published interviews",
  },
  {
    title: "Friends",
    href: "/tutor/friends",
    icon: Users,
    description: "Connect with peers",
  },
  {
    title: "Earnings",
    href: "/tutor/earnings",
    icon: Wallet,
    description: "Earnings & payout requests",
  },
  {
    title: "Settings",
    href: "/tutor/settings",
    icon: Settings,
    description: "Preferences",
  },
]

export function TutorSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/80 text-black font-semibold">
            T
          </div>
          <div className="space-y-1 group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-500/80">CareerCraft</p>
            <p className="text-base font-semibold">Tutor Workspace</p>
            <p className="text-xs text-white/60">Teach, guide, and inspire.</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.title}>
                    <Link href={item.href} className="flex items-center gap-2">
                      <item.icon className="text-emerald-500" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl bg-white/5 p-3 text-sm text-white">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-500/80">Daily Focus</p>
          <p className="mt-1 font-medium">Check student progress</p>
          <p className="text-xs text-white/60">Manage your courses & students.</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
