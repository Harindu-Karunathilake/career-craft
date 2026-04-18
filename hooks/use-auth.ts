"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"

import { firebaseAuth, firebaseDb } from "@/lib/firebase"

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Holds the Firestore profile snapshot unsubscribe function.
        // Must be cleaned up whenever the auth user changes or the component unmounts,
        // otherwise the listener keeps firing after sign-out → permission-denied errors.
        let profileUnsub: (() => void) | null = null

        const authUnsub = onAuthStateChanged(firebaseAuth, (user) => {
            // Always tear down the previous Firestore listener first.
            if (profileUnsub) {
                profileUnsub()
                profileUnsub = null
            }

            setUser(user)

            if (user) {
                profileUnsub = onSnapshot(
                    doc(firebaseDb, "users", user.uid),
                    (snap) => {
                        setProfile(snap.exists() ? snap.data() : null)
                        setLoading(false)
                    },
                    (err) => {
                        // Suppress permission-denied that can occur during sign-out race.
                        if (err.code !== "permission-denied") {
                            console.error("[useAuth] profile snapshot error:", err)
                        }
                        setLoading(false)
                    }
                )
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => {
            authUnsub()
            if (profileUnsub) profileUnsub()
        }
    }, [])

    return { user, profile, loading }
}
