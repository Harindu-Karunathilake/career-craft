"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Users, UserPlus, Search, MessageCircle, UserCheck, X, Clock, Trash2, ExternalLink, AlertCircle, Sparkles } from "lucide-react"

import { useDashBase } from "@/hooks/use-dash-base"

import { firebaseAuth, firebaseDb } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import {
  searchUsers,
  getSuggestedFriends,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriends,
  getIncomingRequests,
  getOutgoingRequests,
  getRelationshipStatus,
} from "@/lib/actions/social"
import type { Friend, FriendRequest, PublicUserProfile } from "@/types"
import type { SuggestedUser } from "@/lib/actions/social"

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ photo, name, px = 44 }: { photo?: string; name?: string; px?: number }) {
  const initial = (name ?? "?")[0]?.toUpperCase() ?? "?"
  return (
    <div
      style={{ width: px, height: px, minWidth: px }}
      className="relative rounded-full overflow-hidden bg-white/10 ring-2 ring-primary/30 flex items-center justify-center flex-shrink-0"
    >
      {photo ? (
        // unoptimized bypasses next/image hostname check for external avatar URLs
        <Image src={photo} alt={name ?? ""} fill sizes={`${px}px`} className="object-cover" unoptimized />
      ) : (
        <span className="text-primary font-bold text-sm select-none">{initial}</span>
      )}
    </div>
  )
}

// ─── Relationship status card for search results ───────────────────────────────
type RelStatus = "none" | "friends" | "request_sent" | "request_received" | "loading"

function AddFriendCard({
  user,
  currentUser,
  onSent,
}: {
  user: PublicUserProfile
  currentUser: { uid: string; displayName: string; photoURL: string }
  onSent: () => void
}) {
  const [status, setStatus] = useState<RelStatus>("loading")

  useEffect(() => {
    let alive = true
    getRelationshipStatus(currentUser.uid, user.uid)
      .then((s) => { if (alive) setStatus(s) })
      .catch(() => { if (alive) setStatus("none") })
    return () => { alive = false }
  }, [currentUser.uid, user.uid])

  const handleSend = async () => {
    setStatus("request_sent")
    try {
      await sendFriendRequest(
        { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
        { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
      )
      onSent()
    } catch {
      setStatus("none") // rollback on failure
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.08] transition-all">
      <UserAvatar photo={user.photoURL} name={user.displayName} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{user.displayName}</p>
        {user.tier && <p className="text-xs text-white/40">{user.tier}</p>}
      </div>
      <div className="flex-shrink-0">
        {status === "loading" && <div className="h-7 w-20 rounded-lg bg-white/10 animate-pulse" />}
        {status === "friends" && (
          <span className="flex items-center gap-1 text-xs text-emerald-400"><UserCheck className="h-3.5 w-3.5" /> Friends</span>
        )}
        {status === "request_sent" && (
          <span className="flex items-center gap-1 text-xs text-white/50"><Clock className="h-3.5 w-3.5" /> Sent</span>
        )}
        {status === "request_received" && (
          <span className="text-xs text-primary">Check notifications</span>
        )}
        {status === "none" && (
          <button
            onClick={handleSend}
            className="flex items-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" /> Add
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Suggestion card ─────────────────────────────────────────────────────────
function SuggestionCard({
  user,
  currentUser,
  onSent,
  dashBase,
}: {
  user: SuggestedUser
  currentUser: { uid: string; displayName: string; photoURL: string }
  onSent: () => void
  dashBase: string
}) {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const handleAdd = async () => {
    setSending(true)
    setSent(true)
    try {
      await sendFriendRequest(
        { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
        { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL }
      )
      onSent()
    } catch {
      setSent(false)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-amber-400/20 p-4 transition-all">
      <div className="flex items-center gap-3">
        <UserAvatar photo={user.photoURL} name={user.displayName} px={40} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{user.displayName}</p>
          {user.tier && <p className="text-[11px] text-white/40">{user.tier}</p>}
        </div>
        {user.mutualCount > 0 && (
          <span className="flex-shrink-0 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            {user.mutualCount} mutual
          </span>
        )}
      </div>
      <p className="text-[11px] text-white/40 leading-snug">{user.reason}</p>
      <div className="flex gap-2">
        <Link
          href={`${dashBase}/profile/${user.uid}`}
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors flex-shrink-0"
          title="View Profile"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={handleAdd}
          disabled={sent || sending}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sent
            ? <><UserCheck className="h-3.5 w-3.5" /> Sent</>
            : <><UserPlus className="h-3.5 w-3.5" /> Add Friend</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── Friend card — NO variant inheritance to avoid Framer Motion opacity bug ───
function FriendCard({
  friend,
  processingId,
  onRemove,
  dashBase,
}: {
  friend: Friend
  processingId: string | null
  onRemove: (uid: string) => void
  dashBase: string
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.08] hover:border-primary/30 transition-all">
      <UserAvatar photo={friend.photo || ""} name={friend.name || "?"} px={44} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{friend.name || "Unknown"}</p>
        {friend.tier && <p className="text-xs text-white/40">{friend.tier}</p>}
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`${dashBase}/chat/${friend.uid}`}
          title="Chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
        <Link
          href={`${dashBase}/profile/${friend.uid}`}
          title="View Profile"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        <button
          onClick={() => onRemove(friend.uid)}
          disabled={processingId === friend.uid}
          title="Remove Friend"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/30 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const dashBase = useDashBase()
  const [currentUser, setCurrentUser] = useState<{
    uid: string; displayName: string; photoURL: string
  } | null>(null)

  const [friends, setFriends] = useState<Friend[]>([])
  const [incomingReqs, setIncomingReqs] = useState<FriendRequest[]>([])
  const [outgoingReqs, setOutgoingReqs] = useState<FriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<PublicUserProfile[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // ── Load friends + requests ──────────────────────────────────────────────
  const loadAll = useCallback(async (uid: string) => {
    // Use allSettled so a partial failure doesn't wipe all data
    const [friendsResult, incomingResult, outgoingResult] = await Promise.allSettled([
      getFriends(uid),
      getIncomingRequests(uid),
      getOutgoingRequests(uid),
    ])

    if (friendsResult.status === "fulfilled") setFriends(friendsResult.value)
    else console.error("[Friends] getFriends error:", friendsResult.reason)

    if (incomingResult.status === "fulfilled") setIncomingReqs(incomingResult.value)
    else console.error("[Friends] getIncomingRequests error:", incomingResult.reason)

    if (outgoingResult.status === "fulfilled") setOutgoingReqs(outgoingResult.value)
    else console.error("[Friends] getOutgoingRequests error:", outgoingResult.reason)

    setLoading(false)

    // Load suggestions after the core data is ready
    setSuggestionsLoading(true)
    try {
      const s = await getSuggestedFriends(uid, 8)
      setSuggestions(s)
    } catch (e) {
      console.error("[Friends] getSuggestedFriends error:", e)
    } finally {
      setSuggestionsLoading(false)
    }
  }, [])

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const authUnsub = firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return }
      try {
        const snap = await getDoc(doc(firebaseDb, "users", user.uid))
        const data = snap.exists() ? snap.data() : null
        setCurrentUser({
          uid: user.uid,
          displayName: data?.name || data?.displayName || user.displayName || "Unknown",
          photoURL: user.photoURL || "",
        })
      } catch {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName || "Unknown",
          photoURL: user.photoURL || "",
        })
      }
      loadAll(user.uid)
    })
    return () => authUnsub()
  }, [loadAll])

  // ── Search — debounced ───────────────────────────────────────────────────
  useEffect(() => {
    const q = searchQuery.trim()

    // Guard: reset when query is empty or user not ready
    if (!q || !currentUser) {
      setSearchResults([])
      setSearchError(null)
      setSearching(false)
      return
    }

    setSearching(true)
    setSearchError(null)

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(q, currentUser.uid)
        setSearchResults(results)
      } catch (err: any) {
        console.error("[Friends] Search error:", err)
        setSearchError("Search failed. Please try again.")
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)

    // KEY FIX: cleanup MUST reset searching to false so cancelled timers
    // don't leave the UI permanently stuck at "Searching..."
    return () => {
      clearTimeout(timer)
      setSearching(false)
    }
  }, [searchQuery, currentUser])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAccept = async (req: FriendRequest) => {
    setProcessingId(req.id)
    try { await acceptFriendRequest(req) } finally { setProcessingId(null) }
    if (currentUser) loadAll(currentUser.uid)
  }

  const handleDecline = async (req: FriendRequest) => {
    setProcessingId(req.id)
    try { await declineFriendRequest(req.id) } finally { setProcessingId(null) }
    if (currentUser) loadAll(currentUser.uid)
  }

  const handleCancel = async (req: FriendRequest) => {
    setProcessingId(req.id)
    try { await cancelFriendRequest(req.id) } finally { setProcessingId(null) }
    if (currentUser) loadAll(currentUser.uid)
  }

  const handleRemove = async (friendUid: string) => {
    if (!currentUser) return
    setProcessingId(friendUid)
    try { await removeFriend(currentUser.uid, friendUid) } finally { setProcessingId(null) }
    loadAll(currentUser.uid)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 max-w-4xl animate-in fade-in-0 duration-300">
      {/* Header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-primary/80">Social</p>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Friends</h1>
        <p className="text-white/50 mt-1">Connect with peers, send messages, and view profiles.</p>
      </div>

      {/* ── Search & Add ── */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <UserPlus className="h-5 w-5 text-primary" /> Find People
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition"
          />
        </div>

        {searchQuery.trim() && (
          <div className="space-y-2">
            {searching ? (
              <div className="flex items-center justify-center py-8 gap-2 text-white/40">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm">Searching…</span>
              </div>
            ) : searchError ? (
              <div className="flex items-center gap-2 text-sm text-red-400 py-4 px-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {searchError}
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">
                No users found for &ldquo;{searchQuery}&rdquo;
              </p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((u) =>
                  currentUser ? (
                    <AddFriendCard
                      key={u.uid}
                      user={u}
                      currentUser={currentUser}
                      onSent={() => loadAll(currentUser.uid)}
                    />
                  ) : null
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Incoming Requests ── */}
      {incomingReqs.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Users className="h-5 w-5 text-primary" /> Requests for You
            <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
              {incomingReqs.length}
            </span>
          </h2>
          <div className="space-y-2">
            {incomingReqs.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
              >
                <UserAvatar photo={req.fromPhoto} name={req.fromName} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{req.fromName}</p>
                  <p className="text-xs text-white/40">wants to connect</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={processingId === req.id}
                    className="flex items-center gap-1.5 rounded-lg bg-primary/20 hover:bg-primary/40 px-3 py-1.5 text-xs font-semibold text-primary transition-colors disabled:opacity-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => handleDecline(req)}
                    disabled={processingId === req.id}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-3 py-1.5 text-xs font-semibold text-white/50 transition-colors disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Outgoing Requests ── */}
      {outgoingReqs.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Clock className="h-5 w-5 text-white/50" /> Sent Requests
          </h2>
          <div className="space-y-2">
            {outgoingReqs.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <UserAvatar photo={req.toPhoto} name={req.toName} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white">{req.toName}</p>
                  <p className="text-xs text-white/40">pending acceptance</p>
                </div>
                <button
                  onClick={() => handleCancel(req)}
                  disabled={processingId === req.id}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 px-3 py-1.5 text-xs font-semibold text-white/50 transition-colors disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Suggested Friends ── */}
      {(suggestionsLoading || suggestions.length > 0) && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-amber-400" />
            People You May Know
            {suggestions.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-bold text-amber-400">
                {suggestions.length}
              </span>
            )}
          </h2>

          {suggestionsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.uid}
                  user={s}
                  currentUser={currentUser!}
                  onSent={() => {
                    setSuggestions((prev) => prev.filter((x) => x.uid !== s.uid))
                    if (currentUser) loadAll(currentUser.uid)
                  }}
                  dashBase={dashBase}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Friends List ── */}
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <UserCheck className="h-5 w-5 text-emerald-400" /> Your Friends
          <span className="text-sm font-normal text-white/40">({friends.length})</span>
        </h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/10 bg-white/5 gap-3">
            <Users className="h-10 w-10 text-white/20" />
            <p className="text-white/40 text-sm">No friends yet. Search above to connect!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {friends.map((friend, index) => (
              <FriendCard
                key={friend.uid || String(index)}
                friend={friend}
                processingId={processingId}
                onRemove={handleRemove}
                dashBase={dashBase}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
