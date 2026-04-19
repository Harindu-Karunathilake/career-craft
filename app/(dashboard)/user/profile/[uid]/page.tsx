"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Award, MessageCircle, UserPlus, UserCheck, Clock, Star, Zap, Shield, Trophy } from "lucide-react"
import { motion, type Variants } from "framer-motion"

import { useDashBase } from "@/hooks/use-dash-base"

import { firebaseAuth, firebaseDb } from "@/lib/firebase"
import {
  getUserProfile,
  getRelationshipStatus,
  sendFriendRequest,
} from "@/lib/actions/social"
import { collection, getDocs } from "firebase/firestore"
import type { PublicUserProfile } from "@/types"

const TIER_CONFIG: Record<string, { color: string; icon: React.ReactNode; gradient: string }> = {
  Novice:   { color: "text-slate-400",   icon: <Star className="w-4 h-4" />,   gradient: "from-slate-500/20 to-slate-600/10" },
  Explorer: { color: "text-emerald-400", icon: <Zap className="w-4 h-4" />,    gradient: "from-emerald-500/20 to-emerald-600/10" },
  Scholar:  { color: "text-blue-400",    icon: <Shield className="w-4 h-4" />, gradient: "from-blue-500/20 to-blue-600/10" },
  Master:   { color: "text-amber-400",   icon: <Trophy className="w-4 h-4" />, gradient: "from-amber-500/20 to-amber-600/10" },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

interface Badge {
  courseId: string
  courseTitle: string
  earnedAt: string
}

type RelStatus = "none" | "friends" | "request_sent" | "request_received" | "loading" | "self"

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params)
  const router = useRouter()
  const dashBase = useDashBase()

  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ displayName: string; photoURL: string } | null>(null)
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [relStatus, setRelStatus] = useState<RelStatus>("loading")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) { router.push("/login"); return }
      setCurrentUid(user.uid)

      // Fetch Firestore name (register-form stores 'name', not 'displayName')
      const { doc: fsDoc, getDoc: fsGetDoc } = await import("firebase/firestore")
      const snap = await fsGetDoc(fsDoc(firebaseDb, "users", user.uid))
      const firestoreName = snap.exists() ? (snap.data()?.name || snap.data()?.displayName) : null
      setCurrentUser({
        displayName: firestoreName || user.displayName || "Unknown",
        photoURL: user.photoURL || "",
      })

      if (user.uid === uid) {
        setRelStatus("self")
        router.push("/profile")
        return
      }

      // Load profile
      const p = await getUserProfile(uid)
      setProfile(p)

      // Load badges (if accessible)
      try {
        const snap2 = await getDocs(collection(firebaseDb, "users", uid, "badges"))
        setBadges(snap2.docs.map((d) => d.data() as Badge))
      } catch {
        // badges might be private — fail gracefully
      }

      // Relationship
      const s = await getRelationshipStatus(user.uid, uid)
      setRelStatus(s)

      setLoading(false)
    })
  }, [uid, router])

  const handleAdd = async () => {
    if (!currentUid || !profile || !currentUser) return
    setRelStatus("request_sent")
    await sendFriendRequest(
      { uid: currentUid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
      { uid: profile.uid, displayName: profile.displayName, photoURL: profile.photoURL }
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-white/50">User not found.</p>
        <Link href={`${dashBase}/friends`} className="text-primary hover:underline text-sm">← Back to Friends</Link>
      </div>
    )
  }

  const tier = profile.tier || "Novice"
  const xp = profile.careerXp || 0
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.Novice
  const nextTierXp = tier === "Master" ? 1000 : tier === "Scholar" ? 1000 : tier === "Explorer" ? 500 : 100
  const prevTierXp = tier === "Master" ? 500 : tier === "Scholar" ? 100 : 0
  const progress = Math.min(100, ((xp - prevTierXp) / (nextTierXp - prevTierXp)) * 100) || 0

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-3xl mx-auto"
    >
      {/* Back */}
      <motion.div variants={itemVariants}>
        <Link
          href={`${dashBase}/friends`}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Friends
        </Link>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={itemVariants}>
        <div className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${tierConfig.gradient} pointer-events-none`} />
          <div className="relative p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}
            <div className="relative h-24 w-24 flex-shrink-0 rounded-full overflow-hidden ring-4 ring-white/20 bg-white/10 flex items-center justify-center">
              {profile.photoURL ? (
                <Image src={profile.photoURL} alt={profile.displayName} fill className="object-cover" />
              ) : (
                <span className="text-4xl font-bold text-primary">{profile.displayName?.[0]?.toUpperCase()}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
              {profile.email && <p className="text-white/40 text-sm mt-1">{profile.email}</p>}

              {/* Tier Badge */}
              <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 ${tierConfig.color}`}>
                {tierConfig.icon}
                <span className="font-semibold text-sm">{tier}</span>
              </div>

              {/* XP Bar */}
              <div className="mt-4 max-w-xs sm:max-w-sm">
                <div className="flex justify-between text-xs text-white/40 mb-1.5">
                  <span>{xp} XP</span>
                  {tier !== "Master" && <span>→ {nextTierXp} XP</span>}
                  {tier === "Master" && <span className="text-amber-400">Max Tier 🏆</span>}
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {relStatus === "loading" && (
                <div className="h-9 w-32 rounded-lg bg-white/10 animate-pulse" />
              )}
              {relStatus === "friends" && currentUid && (
                <Link
                  href={`${dashBase}/chat/${profile.uid}`}
                  className="flex items-center gap-2 rounded-xl bg-primary/20 hover:bg-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Chat
                </Link>
              )}
              {relStatus === "none" && (
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 rounded-xl bg-primary/20 hover:bg-primary/40 px-4 py-2 text-sm font-semibold text-primary transition-colors"
                >
                  <UserPlus className="h-4 w-4" /> Add Friend
                </button>
              )}
              {relStatus === "request_sent" && (
                <span className="flex items-center gap-2 text-sm text-white/40">
                  <Clock className="h-4 w-4" /> Request Sent
                </span>
              )}
              {relStatus === "request_received" && (
                <Link
                  href={`${dashBase}/friends`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <UserCheck className="h-4 w-4" /> Respond ↗
                </Link>
              )}
              {/* Stats */}
              <div className="flex gap-4 mt-2 text-center">
                <div>
                  <p className="text-xl font-bold text-white">{badges.length}</p>
                  <p className="text-xs text-white/40">Badges</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{xp}</p>
                  <p className="text-xs text-white/40">XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div variants={itemVariants}>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
          <Award className="h-5 w-5 text-emerald-400" /> Course Badges
          <span className="text-sm font-normal text-white/40">({badges.length})</span>
        </h2>

        {badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/10 bg-white/5 gap-3">
            <Award className="h-10 w-10 text-white/20" />
            <p className="text-white/40 text-sm">No badges earned yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <motion.div key={badge.courseId} variants={itemVariants}>
                <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-5 overflow-hidden hover:bg-white/8 transition-all">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3">
                    <Award className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-white text-sm leading-snug">{badge.courseTitle}</h3>
                  <p className="text-xs text-white/40 mt-1">
                    Earned {new Date(badge.earnedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
