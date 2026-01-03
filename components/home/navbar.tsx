import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"

export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 glass flex w-full items-center justify-between gap-6 px-6 py-3">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        CareerCraft
      </Link>
      <NavigationMenu className="flex-1 justify-center ">
        <NavigationMenuList>
             <NavigationMenuItem>
            <NavigationMenuLink href="/" className="font-semibold">Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/interview" className="font-semibold">Interviews</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/resume" className="font-semibold">Resume</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="/blog" className="font-semibold">Blog</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button asChild size="sm" className="min-w-24">
        <Link href="/user">Dashboard</Link>
      </Button>
    </header>
  )
}
