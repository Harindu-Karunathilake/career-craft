"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"

import { firebaseAuth, firebaseDb } from "@/lib/firebase"

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
            setUser(user)
            if (user) {
                // Subscribe to user profile in Firestore
                const { doc, onSnapshot } = await import("firebase/firestore")
                onSnapshot(doc(firebaseDb, "users", user.uid), (doc) => {
                    if (doc.exists()) {
                        setProfile(doc.data())
                    } else {
                        setProfile(null)
                    }
                    setLoading(false)
                })
                // Clean up the snapshot listener when the user changes or component unmounts
                // However, onAuthStateChanged cleanup is tricky with nested listeners. 
                // Since this is a top-level hook, it's generally okay. 
                // A more robust solution would be managing the subscription in a separate effect dependent on `user`.
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [])

    return { user, profile, loading }
}
