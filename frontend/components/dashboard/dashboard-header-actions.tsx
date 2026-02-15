"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { signOut } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { firebaseAuth } from "@/lib/firebase"

export function DashboardHeaderActions() {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
    </div>
  )
}
