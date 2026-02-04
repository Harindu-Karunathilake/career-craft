"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (profile && !allowedRoles.includes(profile.role)) {
        // Redirect based on their actual role
        if (profile.role === 'admin') router.push('/admin')
        else if (profile.role === 'tutor') router.push('/tutor')
        else router.push('/user') 
      }
    }
  }, [user, profile, loading, router, allowedRoles])

  if (loading) {
    return <div className="flex h-dvh w-full items-center justify-center bg-black text-white">Loading...</div>
  }

  if (!user || (profile && !allowedRoles.includes(profile.role))) {
      return null
  }

  return <>{children}</>
}
