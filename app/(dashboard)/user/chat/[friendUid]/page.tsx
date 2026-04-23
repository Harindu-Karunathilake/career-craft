"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Send, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

import { firebaseAuth } from "@/lib/firebase"
import {
  getChatId,
  sendMessage,
  subscribeToMessages,
  getUserProfile,
  getFriends,
  markChatNotificationsRead,
} from "@/lib/actions/social"
import { useDashBase } from "@/hooks/use-dash-base"
import type { ChatMessage, PublicUserProfile } from "@/types"

export default function ChatPage({ params }: { params: Promise<{ friendUid: string }> }) {
  const { friendUid } = use(params)
  const router = useRouter()
  const dashBase = useDashBase()

  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [friend, setFriend] = useState<PublicUserProfile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [currentUser, setCurrentUser] = useState<{ uid: string; displayName: string; photoURL: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) { router.push("/login"); return }
      setCurrentUid(user.uid)

      // Fetch the Firestore display name (same pattern as friends page)
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { firebaseDb } = await import("@/lib/firebase")
        const snap = await getDoc(doc(firebaseDb, "users", user.uid))
        const data = snap.exists() ? snap.data() : null
        setCurrentUser({
          uid: user.uid,
          displayName: data?.name || data?.displayName || user.displayName || "Unknown",
          photoURL: user.photoURL || "",
        })
      } catch {
        setCurrentUser({ uid: user.uid, displayName: user.displayName || "Unknown", photoURL: user.photoURL || "" })
      }

      // Verify they are actually friends
      const friends = await getFriends(user.uid)
      const isFriend = friends.some((f) => f.uid === friendUid)
      setAuthorized(isFriend)

      // Load friend's profile
      const profile = await getUserProfile(friendUid)
      setFriend(profile)
    })
  }, [friendUid, router])

  // Subscribe to messages + mark notifications as read
  useEffect(() => {
    if (!currentUid || !authorized) return
    const chatId = getChatId(currentUid, friendUid)
    // Mark unread message notifications for this chat as read
    markChatNotificationsRead(currentUid, chatId).catch(() => {})
    const unsub = subscribeToMessages(chatId, setMessages)
    return unsub
  }, [currentUid, friendUid, authorized])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || !currentUid || sending) return
    setSending(true)
    const chatId = getChatId(currentUid, friendUid)
    await sendMessage(
      chatId,
      currentUid,
      text.trim(),
      friendUid,
      {
        name: currentUser?.displayName || "Unknown",
        photo: currentUser?.photoURL || "",
      }
    )
    setText("")
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── States ──────────────────────────────────────────────────────────────────
  if (authorized === null || !friend) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-white/40 text-sm">Loading chat…</p>
        </div>
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <MessageCircle className="h-12 w-12 text-white/20" />
        <p className="text-white/60 text-center">You can only chat with your friends.<br />Send a friend request first.</p>
        <Link
          href={`${dashBase}/friends`}
          className="text-primary hover:underline text-sm"
        >
          Go to Friends
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 73px)", margin: "-2rem -1.5rem -2rem" }}>

      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
        <Link href={`${dashBase}/friends`}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <Link href={`${dashBase}/profile/${friend.uid}`} className="flex items-center gap-3 group min-w-0">
          <div className="relative h-11 w-11 rounded-full overflow-hidden ring-2 ring-primary/40 bg-white/10 flex items-center justify-center flex-shrink-0">
            {friend.photoURL ? (
              <Image src={friend.photoURL} alt={friend.displayName} fill className="object-cover" />
            ) : (
              <span className="text-primary font-bold text-lg">{friend.displayName?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white group-hover:text-primary transition-colors truncate">
              {friend.displayName}
            </p>
            <p className="text-xs text-white/40">{friend.tier || "Novice"}</p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <MessageCircle className="h-12 w-12 text-white/10" />
            <p className="text-white/30 text-sm">No messages yet. Say hello! 👋</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUid
          const isFirst = i === 0 || messages[i - 1].senderId !== msg.senderId

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"} ${isFirst ? "mt-4" : "mt-0.5"}`}
            >
              <div
                className={`max-w-[60%] xl:max-w-[50%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMe
                    ? "bg-primary/25 text-white rounded-br-sm"
                    : "bg-white/10 text-white rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-3 px-6 py-4 border-t border-white/10 bg-black/20 backdrop-blur-md flex-shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 backdrop-blur-md transition max-h-40 overflow-y-auto"
          style={{ lineHeight: "1.6" }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-black hover:bg-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
