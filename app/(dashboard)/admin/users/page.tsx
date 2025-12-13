"use client"

import { useEffect, useState } from "react"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { firebaseDb } from "@/lib/firebase"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  status: string
  wantsUpdates: boolean
  createdAt?: Date
  updatedAt?: Date
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadUsers() {
      setIsLoading(true)
      setError(null)
      try {
        const snapshot = await getDocs(collection(firebaseDb, "users"))
        if (!active) return
        const data: UserRow[] = snapshot.docs.map((docRef) => {
          const data = docRef.data()
          const createdAt = data.createdAt?.toDate?.()
          return {
            id: docRef.id,
            name: (data.name as string) || "Unnamed user",
            email: (data.email as string) || "",
            role: (data.role as string) || "user",
            status: (data.status as string) || "active",
            wantsUpdates: Boolean(data.wantsUpdates),
            createdAt,
          }
        })
        data.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime()
          }
          if (a.createdAt) return -1
          if (b.createdAt) return 1
          return a.name.localeCompare(b.name)
        })
        setRows(data)
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load users")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()
    return () => {
      active = false
    }
  }, [])

  const formatJoined = (date?: Date) => {
    if (!date) return "Joined date unavailable"
    return Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
  }

  const updateUserLocally = (userId: string, payload: Partial<UserRow>) => {
    setRows((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, ...payload, updatedAt: new Date() } : user))
    )
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionUserId(userId)
    try {
      await updateDoc(doc(firebaseDb, "users", userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      })
      updateUserLocally(userId, { role: newRole })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    } finally {
      setActionUserId(null)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    const user = rows.find((row) => row.id === userId)
    if (!user) return
    const nextStatus = user.status === "disabled" ? "active" : "disabled"
    setActionUserId(userId)
    try {
      await updateDoc(doc(firebaseDb, "users", userId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      })
      updateUserLocally(userId, { status: nextStatus })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setActionUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = rows.find((row) => row.id === userId)
    if (!user) return
    const confirmed = window.confirm(
      `Delete ${user.name || "this user"}? This removes their record from the database.`
    )
    if (!confirmed) return

    setDeletingUserId(userId)
    try {
      await deleteDoc(doc(firebaseDb, "users", userId))
      setRows((prev) => prev.filter((row) => row.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">User management</p>
        <h1 className="text-2xl font-semibold text-white">Accounts & status</h1>
      </div>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Team roster</CardTitle>
          <CardDescription className="text-white/70">
            Manage live Firebase users: adjust roles, disable access, or remove accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-16 animate-pulse rounded-lg bg-white/10" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-white/70">No users found in the database.</p>
          ) : (
            <div className="space-y-4">
              {rows.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 px-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-white/60">{user.email || "No email on record"}</p>
                    <p className="text-xs text-white/50">{formatJoined(user.createdAt)}</p>
                    <p className="text-xs text-white/50">
                      Updates: {user.wantsUpdates ? "Subscribed" : "Not subscribed"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:justify-end">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-center capitalize">
                      {user.status}
                    </span>
                    <label className="flex items-center gap-2 text-[11px]/4 text-white/60">
                      Role
                      <select
                        className="rounded-md border border-white/20 bg-transparent px-2 py-1 text-white"
                        value={user.role}
                        onChange={(event) => handleRoleChange(user.id, event.target.value)}
                        disabled={actionUserId === user.id}
                      >
                        <option value="user" className="text-black">
                          User
                        </option>
                        <option value="admin" className="text-black">
                          Admin
                        </option>
                      </select>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id)}
                      disabled={actionUserId === user.id}
                    >
                      {user.status === "disabled" ? "Enable" : "Disable"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deletingUserId === user.id}
                    >
                      {deletingUserId === user.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
