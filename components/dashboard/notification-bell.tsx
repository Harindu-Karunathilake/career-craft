"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Check, X, UserPlus, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { firebaseAuth } from "@/lib/firebase"
import {
  subscribeToIncomingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  subscribeToMessageNotifications,
  markChatNotificationsRead,
} from "@/lib/actions/social"
import type { FriendRequest, AppNotification } from "@/types"

// ─── Mini avatar ─────────────────────────────────────────────────────────────
function MiniAvatar({ src, name }: { src?: string; name?: string }) {
  return (
    <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-white/10 ring-2 ring-primary/20 flex items-center justify-center">
      {src ? (
        <Image src={src} alt={name ?? ""} fill className="object-cover" unoptimized />
      ) : (
        <span className="text-sm font-bold text-primary">{(name ?? "?")[0]?.toUpperCase()}</span>
      )}
    </div>
  )
}

export function NotificationBell() {
  const router = useRouter()
  const pathname = usePathname()

  // Derive the correct dashboard base from the current URL
  // /tutor/... → tutor dashboard, everything else → user dashboard
  const dashBase = pathname.startsWith("/tutor") ? "/tutor" : "/user"

  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [msgNotifications, setMsgNotifications] = useState<AppNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // ── Subscribe to both friend requests AND message notifications ────────────
  useEffect(() => {
    let reqUnsub: (() => void) | null = null
    let msgUnsub: (() => void) | null = null

    const authUnsub = firebaseAuth.onAuthStateChanged((user) => {
      // Always clean up old listeners
      reqUnsub?.(); reqUnsub = null
      msgUnsub?.(); msgUnsub = null

      if (!user) {
        setPendingRequests([])
        setMsgNotifications([])
        setCurrentUid(null)
        return
      }

      setCurrentUid(user.uid)
      reqUnsub = subscribeToIncomingRequests(user.uid, setPendingRequests)
      msgUnsub = subscribeToMessageNotifications(user.uid, setMsgNotifications)
    })

    return () => {
      authUnsub()
      reqUnsub?.()
      msgUnsub?.()
    }
  }, [])

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAccept = async (req: FriendRequest) => {
    setProcessingId(req.id)
    try { await acceptFriendRequest(req) } finally { setProcessingId(null) }
  }

  const handleDecline = async (req: FriendRequest) => {
    setProcessingId(req.id)
    try { await declineFriendRequest(req.id) } finally { setProcessingId(null) }
  }

  const handleOpenChat = async (notif: AppNotification) => {
    if (!currentUid || !notif.chatId) return
    setIsOpen(false)
    await markChatNotificationsRead(currentUid, notif.chatId).catch(() => {})
    const friendUid = notif.senderUid
    if (friendUid) router.push(`${dashBase}/chat/${friendUid}`)
  }

  const totalCount = pendingRequests.length + msgNotifications.length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={`Notifications${totalCount > 0 ? ` (${totalCount})` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 hover:ring-primary hover:bg-white/20 transition-all duration-200"
      >
        <Bell className="h-4 w-4 text-white/80" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black animate-pulse">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {totalCount > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                {totalCount} new
              </span>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">

            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell className="h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">You&apos;re all caught up!</p>
              </div>
            ) : (
              <>
                {/* ── Message notifications ── */}
                {msgNotifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleOpenChat(notif)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="relative">
                      <MiniAvatar src={notif.senderPhoto} name={notif.senderName} />
                      {/* Blue dot badge */}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-black flex items-center justify-center">
                        <MessageCircle className="h-1.5 w-1.5 text-white" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate leading-tight">
                        {notif.senderName}
                      </p>
                      <p className="text-xs text-white/50 truncate mt-0.5">{notif.text}</p>
                    </div>
                    <span className="text-[10px] text-white/30 flex-shrink-0">msg</span>
                  </button>
                ))}

                {/* ── Friend requests ── */}
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative">
                      <MiniAvatar src={req.fromPhoto} name={req.fromName} />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary ring-2 ring-black flex items-center justify-center">
                        <UserPlus className="h-1.5 w-1.5 text-black" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate leading-tight">
                        {req.fromName}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">wants to connect</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(req)}
                        disabled={processingId === req.id}
                        title="Accept"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 hover:bg-primary/40 text-primary transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDecline(req)}
                        disabled={processingId === req.id}
                        title="Decline"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-red-500/30 hover:text-red-400 text-white/50 transition-colors disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-white/10 flex gap-4 justify-center">
            <Link
              href={`${dashBase}/friends`}
              onClick={() => setIsOpen(false)}
              className="text-xs text-primary/70 hover:text-primary transition-colors"
            >
              Friends →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
