"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

import { Menu, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useAuth } from "@/hooks/use-auth"

export function SiteNavbar() {
  const { user, profile, loading } = useAuth()

  const getDashboardUrl = () => {
    if (profile?.role === "tutor") return "/tutor"
    if (profile?.role === "admin") return "/admin"
    return "/user"
  }

  const dashboardUrl = getDashboardUrl()

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 flex w-full items-center justify-between gap-6 px-6 py-4 border-b border-white/10 bg-black/50 backdrop-blur-xl"
    >
      <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
        CareerCraft
      </Link>
      
      {/* Desktop Navigation */}
      <NavigationMenu className="flex-1 justify-center hidden md:flex">
        <NavigationMenuList className="gap-2">
           <NavigationMenuItem>
            <NavigationMenuLink href="/" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/10 data-[state=open]:bg-white/10">Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/interview" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/10 data-[state=open]:bg-white/10">Interviews</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/resume" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/10 data-[state=open]:bg-white/10">Resume</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/blog" className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-white/10 data-[state=open]:bg-white/10">Blog</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-4">
        {loading ? (
          <Button disabled size="sm" className="hidden md:flex min-w-24 bg-white/50 text-black">
             <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
        ) : user ? (
          <Button asChild size="sm" className="hidden md:flex min-w-24 bg-white text-black hover:bg-zinc-200">
              <Link href={dashboardUrl}>Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="sm" className="hidden md:flex min-w-24 bg-white text-black hover:bg-zinc-200">
              <Link href="/login">Login</Link>
          </Button>
        )}

        {/* Mobile Menu */}
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l border-white/10 bg-black/95 backdrop-blur-xl pt-10">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col gap-4 px-6">
                    <Link href="/" className="flex items-center py-2 text-lg font-medium text-zinc-300 hover:text-white transition-colors">
                        Home
                    </Link>
                    <Link href="/interview" className="flex items-center py-2 text-lg font-medium text-zinc-300 hover:text-white transition-colors">
                        Interviews
                    </Link>
                    <Link href="/resume" className="flex items-center py-2 text-lg font-medium text-zinc-300 hover:text-white transition-colors">
                        Resume
                    </Link>
                    <Link href="/blog" className="flex items-center py-2 text-lg font-medium text-zinc-300 hover:text-white transition-colors">
                        Blog
                    </Link>
                    <div className="h-px bg-white/10 my-2" />
                    {loading ? (
                        <div className="flex items-center py-2 text-lg font-medium text-white/50">
                            Loading...
                        </div>
                    ) : user ? (
                        <Link href={dashboardUrl} className="flex items-center py-2 text-lg font-medium text-white">
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/login" className="flex items-center py-2 text-lg font-medium text-white">
                            Login
                        </Link>
                    )}
                </nav>
            </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  )
}
