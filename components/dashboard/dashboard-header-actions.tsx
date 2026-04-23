"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "firebase/auth"
import Image from "next/image"
import { User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { firebaseAuth } from "@/lib/firebase"
import { NotificationBell } from "@/components/dashboard/notification-bell"

export function DashboardHeaderActions() {
  const router = useRouter()
  const pathname = usePathname()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setPhotoURL(user?.photoURL ?? null)
      setDisplayName(user?.displayName ?? null)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await signOut(firebaseAuth)
      router.push("/login")
    } catch (error) {
      console.error("Failed to sign out", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        asChild
        size="sm"
        variant="outline"
        className="border-white/30 bg-transparent text-white hover:bg-white/10"
      >
        <Link href="/">Back to site</Link>
      </Button>
      <Button size="sm" variant="secondary" onClick={handleSignOut} disabled={isSigningOut}>
        {isSigningOut ? "Signing out..." : "Log out"}
      </Button>

      {/* Notification Bell */}
      <NotificationBell />

      {/* Avatar → Profile */}
      <Link
        href={pathname?.startsWith("/tutor") ? "/tutor/profile" : "/profile"}
        title="My Profile"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-white/20 hover:ring-primary transition-all overflow-hidden bg-white/10"
      >
        {photoURL ? (
          <Image src={photoURL} alt={displayName ?? "Avatar"} fill className="object-cover" />
        ) : (
          <User className="h-4 w-4 text-white/70" />
        )}
      </Link>
    </div>
  )
}
