"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Settings, BookOpen } from "lucide-react"

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

const adminNav = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Courses",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/80 text-black font-semibold">
            AD
          </div>
          <div className="space-y-1 group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.35em] text-primary/80">CareerCraft</p>
            <p className="text-base font-semibold">Admin console</p>
            <p className="text-xs text-white/60">Monitor users & system.</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild isActive={pathname === link.href} tooltip={link.title}>
                    <Link href={link.href} className="flex items-center gap-2">
                      <link.icon className="text-primary" />
                      <span>{link.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="rounded-xl bg-white/5 p-3 text-xs text-white/70">
          <p className="text-xs uppercase tracking-[0.35em] text-primary/80">System status</p>
          <p className="mt-1 text-sm font-medium text-white">All services operational</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
