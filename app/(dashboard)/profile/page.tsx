"use client"

import { useEffect, useState } from "react"
import { firebaseAuth, firebaseDb, firebaseStorage } from "@/lib/firebase"
import { User, Award, Star, Zap, Shield, Trophy, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { motion, Variants } from "framer-motion"
import { useRef } from "react"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { updateProfile } from "firebase/auth"
import { Loader2, Camera } from "lucide-react"

const TIER_CONFIG: Record<string, { color: string; icon: React.ReactNode; gradient: string }> = {
  Novice:   { color: "text-slate-400",   icon: <Star className="w-5 h-5" />,   gradient: "from-slate-500/20 to-slate-600/10" },
  Explorer: { color: "text-emerald-400", icon: <Zap className="w-5 h-5" />,    gradient: "from-emerald-500/20 to-emerald-600/10" },
  Scholar:  { color: "text-blue-400",    icon: <Shield className="w-5 h-5" />, gradient: "from-blue-500/20 to-blue-600/10" },
  Master:   { color: "text-amber-400",   icon: <Trophy className="w-5 h-5" />, gradient: "from-amber-500/20 to-amber-600/10" },
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

interface CourseBadge {
  courseId: string
  courseTitle: string
  earnedAt: string
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [badges, setBadges] = useState<CourseBadge[]>([])
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !firebaseAuth.currentUser) return

    setIsUploadingPhoto(true)
    try {
      // 1. Upload to Storage
      const storageRef = ref(firebaseStorage, `users/profile_pics/${firebaseAuth.currentUser.uid}_${Date.now()}`)
      const snapshot = await uploadBytes(storageRef, file)
      const url = await getDownloadURL(snapshot.ref)

      // 2. Update Auth Profile
      await updateProfile(firebaseAuth.currentUser, { photoURL: url })

      // 3. Update Firestore Document
      const { doc, updateDoc } = await import("firebase/firestore")
      await updateDoc(doc(firebaseDb, "users", firebaseAuth.currentUser.uid), { photoURL: url })

      // 4. Update UI
      setPhotoURL(url)
    } catch (err) {
      console.error("Error uploading photo:", err)
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) { setLoading(false); return }

      setPhotoURL(user.photoURL)
      setDisplayName(user.displayName)
      setEmail(user.email)

      try {
        const { collection, getDocs, doc, getDoc, setDoc, query, where } = await import("firebase/firestore")

        // Fetch user Firestore profile (XP, tier)
        const userRef = doc(firebaseDb, "users", user.uid)
        const userDoc = await getDoc(userRef)
        const currentUserData = userDoc.exists() ? userDoc.data() : {}

        // Fetch already-earned badges
        const badgesSnap = await getDocs(collection(firebaseDb, "users", user.uid, "badges"))
        const existingBadgeIds = new Set(badgesSnap.docs.map(d => d.id))
        const fetched: CourseBadge[] = badgesSnap.docs.map(d => d.data() as CourseBadge)

        // ── Backfill: scan completed enrollments ────────────────────────────
        const enrollSnap = await getDocs(
          query(
            collection(firebaseDb, "enrollments"),
            where("userId", "==", user.uid),
          )
        )

        let accruedXp = currentUserData.careerXp || 0
        let didWrite = false

        for (const enrDoc of enrollSnap.docs) {
          const enr = enrDoc.data()
          const completedCount: number = enr.completedLessons?.length || 0
          if (completedCount === 0) continue

          // Fetch course to get totalLessons & title
          const courseSnap = await getDoc(doc(firebaseDb, "courses", enr.courseId))
          if (!courseSnap.exists()) continue
          const course = courseSnap.data()!
          const totalLessons: number = course.chapters?.reduce(
            (sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0
          ) || 0

          const isCourseCompleted = enr.status === "completed" || (totalLessons > 0 && completedCount >= totalLessons)

          // 1. Grant missing XP for each completed lesson
          // We only backfill if the user's stored XP is 0 (never ran before)
          if ((currentUserData.careerXp || 0) === 0) {
            accruedXp += completedCount * 10
            didWrite = true
          }

          // 2. Grant missing badge for completed courses
          if (isCourseCompleted && !existingBadgeIds.has(enr.courseId)) {
            await setDoc(doc(firebaseDb, "users", user.uid, "badges", enr.courseId), {
              courseId: enr.courseId,
              courseTitle: course.title || "Course",
              earnedAt: enr.completedAt || new Date().toISOString(),
            })
            fetched.push({ courseId: enr.courseId, courseTitle: course.title, earnedAt: enr.completedAt || new Date().toISOString() } as CourseBadge)
            existingBadgeIds.add(enr.courseId)
            didWrite = true
          }
        }

        // Write XP backfill
        if (didWrite && (currentUserData.careerXp || 0) === 0 && accruedXp > 0) {
          const newTier = accruedXp >= 1000 ? "Master" : accruedXp >= 500 ? "Scholar" : accruedXp >= 100 ? "Explorer" : "Novice"
          await setDoc(userRef, { careerXp: accruedXp, tier: newTier }, { merge: true })
          setUserData({ ...currentUserData, careerXp: accruedXp, tier: newTier })
        } else {
          setUserData(currentUserData)
        }

        setBadges(fetched)
      } catch (e) {
        console.error("Error loading profile:", e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-white/60">Loading profile...</div>
  )

  const tier = userData?.tier || "Novice"
  const xp   = userData?.careerXp || 0
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.Novice
  const nextTierXp = tier === "Master" ? 1000 : tier === "Scholar" ? 1000 : tier === "Explorer" ? 500 : 100
  const prevTierXp = tier === "Master" ? 500 : tier === "Scholar" ? 100 : 0
  const progress = Math.min(100, ((xp - prevTierXp) / (nextTierXp - prevTierXp)) * 100) || 0

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 max-w-4xl mx-auto relative z-10">

      {/* Profile Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${tierConfig.gradient} pointer-events-none`} />
          <CardContent className="relative p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar */}
            <div className="relative flex-shrink-0 h-24 w-24 rounded-full overflow-hidden ring-4 ring-white/20 bg-white/10 flex items-center justify-center group">
              {photoURL ? (
                <Image src={photoURL} alt={displayName ?? "Avatar"} fill className="object-cover" />
              ) : (
                <User className="h-10 w-10 text-white/50" />
              )}
              
              {/* Hover Edit Overlay */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-white mb-1" />
                    <span className="text-[10px] text-white font-medium">Change</span>
                  </>
                )}
              </button>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white">{displayName || "Anonymous Learner"}</h1>
              <p className="text-white/50 text-sm mt-1">{email}</p>

              {/* Tier Badge */}
              <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 ${tierConfig.color}`}>
                {tierConfig.icon}
                <span className="font-semibold text-sm">{tier}</span>
              </div>

              {/* XP Bar */}
              <div className="mt-4 max-w-xs sm:max-w-sm">
                <div className="flex justify-between text-xs text-white/50 mb-1.5">
                  <span>{xp} XP total</span>
                  {tier !== "Master" && <span>Next tier at {nextTierXp} XP</span>}
                  {tier === "Master" && <span className="text-amber-400">Max Tier Reached 🏆</span>}
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col items-center gap-4 text-center">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{badges.length}</span>
                <span className="text-xs text-white/50">Badges</span>
              </div>
              <div className="hidden sm:block w-full h-px bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{xp}</span>
                <span className="text-xs text-white/50">XP</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* Badges Section */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Course Badges
          <span className="ml-1 text-sm text-white/40 font-normal">({badges.length})</span>
        </h2>

        {badges.length === 0 ? (
          <Card className="border-white/10 bg-white/5 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <Award className="w-12 h-12 text-white/20" />
              <p className="text-white/50 text-sm">No badges yet. Complete a course to earn your first one!</p>
              <Link href="/courses" className="text-primary text-sm hover:underline">Browse Courses →</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => {
              const userId = firebaseAuth.currentUser?.uid
              const dateStr = new Date(badge.earnedAt).toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric"
              })
              return (
                <motion.div key={badge.courseId} variants={itemVariants}>
                  <Card className="border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-200 group overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <Award className="w-6 h-6 text-emerald-400" />
                        </div>
                        {userId && (
                          <Link
                            href={`/badges/${userId}/${badge.courseId}`}
                            target="_blank"
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-white/50 hover:text-white"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm leading-snug">{badge.courseTitle}</h3>
                        <p className="text-xs text-white/40 mt-1">Earned {dateStr}</p>
                      </div>
                      {userId && (
                        <Link
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/badges/${userId}/${badge.courseId}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-medium text-[#0A66C2] hover:underline mt-1"
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                          Add to LinkedIn
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

    </motion.div>
  )
}
