"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase"

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    return { user, loading }
}
