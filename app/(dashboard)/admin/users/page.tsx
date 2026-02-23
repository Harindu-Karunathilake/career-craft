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
import { Check, X, FileText, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
  institutionName?: string
  address?: string
  cvUrl?: string
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
            institutionName: data.institutionName,
            address: data.address,
            cvUrl: data.cvUrl,
            createdAt,
          }
        })
        data.sort((a, b) => {
          // Sort pending tutors first effectively
          if (a.status === 'pending' && b.status !== 'pending') return -1
          if (a.status !== 'pending' && b.status === 'pending') return 1

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

  const handleVerification = async (userId: string, approved: boolean) => {
      setActionUserId(userId)
      const newStatus = approved ? 'active' : 'rejected'
      try {
          await updateDoc(doc(firebaseDb, "users", userId), {
              status: newStatus,
              updatedAt: serverTimestamp(),
          })
          updateUserLocally(userId, { status: newStatus })
      } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to verify user")
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

  const pendingTutors = rows.filter(user => user.role === 'tutor' && user.status === 'pending')
  const allOtherUsers = rows.filter(user => !(user.role === 'tutor' && user.status === 'pending'))

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">User management</p>
        <h1 className="text-2xl font-semibold text-white">Accounts & status</h1>
      </div>

       {error && (
            <p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
        )}

      <Tabs defaultValue="pending" className="w-full">
         <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="pending">
                Requests
                {pendingTutors.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{pendingTutors.length}</Badge>
                )}
            </TabsTrigger>
            <TabsTrigger value="all">All Users</TabsTrigger>
         </TabsList>

         <TabsContent value="pending" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                     Array.from({ length: 3 }).map((_, idx) => (
                        <Card key={idx} className="border-white/10 bg-white/5 animate-pulse h-64" />
                      ))
                ) : pendingTutors.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/50 border border-dashed border-white/10 rounded-lg">
                        <p>No pending tutor verifications</p>
                    </div>
                ) : (
                    pendingTutors.map((user) => (
                        <Card key={user.id} className="border-white/10 bg-white/5 text-white flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                         <CardTitle className="text-base">{user.name}</CardTitle>
                                         <CardDescription className="text-xs text-white/60">{user.email}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 text-sm space-y-4">
                                <div className="space-y-2 rounded-md bg-white/5 p-3">
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                        <span className="text-white/40">Institution:</span>
                                        <span className="font-medium">{user.institutionName || "N/A"}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                         <span className="text-white/40">Address:</span>
                                         <span className="font-medium">{user.address || "N/A"}</span>
                                    </div>
                                </div>
                                {user.cvUrl ? (
                                    <Button variant="outline" size="sm" className="w-full gap-2 border-white/10 hover:bg-white/10" asChild>
                                        <a href={user.cvUrl} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-4 w-4" /> View CV / Resume
                                        </a>
                                    </Button>
                                ) : (
                                    <p className="text-xs text-red-400 italic">No CV uploaded</p>
                                )}
                            </CardContent>
                             <div className="p-4 border-t border-white/10 grid grid-cols-2 gap-3">
                                <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                                    onClick={() => handleVerification(user.id, false)}
                                    disabled={actionUserId === user.id}
                                >
                                    {actionUserId === user.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <X className="h-4 w-4 mr-2" />}
                                    Reject
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="w-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                                     onClick={() => handleVerification(user.id, true)}
                                     disabled={actionUserId === user.id}
                                >
                                     {actionUserId === user.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Check className="h-4 w-4 mr-2" />}
                                    Approve
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
         </TabsContent>

         <TabsContent value="all">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>Team roster</CardTitle>
              <CardDescription className="text-white/70">
                Manage live Firebase users: adjust roles, disable access, or remove accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
             
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-16 animate-pulse rounded-lg bg-white/10" />
                  ))}
                </div>
              ) : allOtherUsers.length === 0 ? (
                <p className="text-sm text-white/70">No active users found.</p>
              ) : (
                <div className="space-y-4">
                  {allOtherUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 px-4 py-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-white/60">{user.email || "No email on record"}</p>
                        <p className="text-xs text-white/50">{formatJoined(user.createdAt)}</p>
                        <div className="flex gap-2 mt-1">
                             <p className="text-[10px] text-white/40">
                                Updates: {user.wantsUpdates ? "Yes" : "No"}
                            </p>
                            {user.role === 'tutor' && user.institutionName && (
                                <p className="text-[10px] text-white/40 border-l border-white/10 pl-2">
                                    {user.institutionName}
                                </p>
                            )}
                        </div>
                       
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:justify-end">
                        <span className={`rounded-full px-3 py-1 text-center capitalize ${
                            user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                            user.status === 'disabled' ? 'bg-white/10 text-white/60' :
                            'bg-red-500/10 text-red-400'
                        }`}>
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
                              Candidate
                            </option>
                            <option value="tutor" className="text-black">
                              Tutor
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
                          className="border-white/20 bg-transparent hover:bg-white/10"
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
        </TabsContent>
      </Tabs>
      
    </div>
  )
}
