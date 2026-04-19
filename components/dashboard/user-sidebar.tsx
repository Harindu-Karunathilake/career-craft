"use client";

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Briefcase, FileText, LayoutDashboard, Settings, Globe, Users } from "lucide-react"

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
    href: "/user",
    icon: LayoutDashboard,
    description: "Snapshot of your pipeline",
  },
  {
    title: "Interviews",
    href: "/user/interviews",
    icon: Briefcase,
    description: "Upcoming loops & feedback",
  },
  {
    title: "Resume",
    href: "/user/resume",
    icon: FileText,
    description: "Documents & tailoring",
  },
  {
    title: "Community",
    href: "/user/community",
    icon: Globe,
    description: "Browse published interviews",
  },
  {
    title: "Friends",
    href: "/user/friends",
    icon: Users,
    description: "Connect & chat with peers",
  },
  {
    title: "Settings",
    href: "/user/settings",
    icon: Settings,
    description: "Preferences",
  },
]

export function UserSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/80 text-black font-semibold">
            CC
          </div>
          <div className="space-y-1 group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/80">CareerCraft</p>
            <p className="text-base font-semibold">User workspace</p>
            <p className="text-xs text-white/60">Track, prep, and stay organized.</p>
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
                      <item.icon className="text-primary" />
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
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Daily focus</p>
          <p className="mt-1 font-medium">Review new interview feedback</p>
          <p className="text-xs text-white/60">Tap Settings to adjust reminders.</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
