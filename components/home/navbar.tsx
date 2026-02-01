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

export function SiteNavbar() {
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
      <Button asChild size="sm" className="min-w-24 bg-white text-black hover:bg-zinc-200">
        <Link href="/user">Dashboard</Link>
      </Button>
    </motion.header>
  )
}
