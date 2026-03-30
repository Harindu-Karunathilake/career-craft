"use client"

import { useEffect, useState, useCallback } from "react"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ReportDialog } from "@/components/courses/report-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, BookOpen, PlayCircle, MonitorPlay, Eye, ShoppingCart, Lock, CheckCircle2, Loader2, Award } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Chapter, Lesson } from "@/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import Script from "next/script"
import { toast } from "sonner"
import { markLessonComplete as _markLessonComplete } from "@/lib/actions/gamification"
import Link from "next/link"

declare global {
    interface Window {
        payhere: {
            startPayment: (payment: Record<string, string>) => void;
            onCompleted: (orderId: string) => void;
            onDismissed: () => void;
            onError: (error: string) => void;
            sandbox: boolean;
        };
    }
}

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { courseId } = params as { courseId: string }
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isOwnCourse, setIsOwnCourse] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [payhereReady, setPayhereReady] = useState(false)
  
  // Progression States
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [canMarkComplete, setCanMarkComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(5)

  // ── Show toast from PayHere redirect ──────────────────────────────────────
  useEffect(() => {
    const status = searchParams.get("status")
    if (status === "success") toast.success("Payment successful! You are now enrolled.")
    if (status === "cancelled") toast.error("Payment was cancelled.")
  }, [searchParams])

  // ── Fetch course + check enrollment ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!courseId) return
    try {
      const docRef = doc(firebaseDb, "courses", courseId)
      const docSnap = await getDoc(docRef)
      if (!docSnap.exists()) { setLoading(false); return }

      const data: any = { id: docSnap.id, ...docSnap.data() }
      setCourse(data)
      if (data.chapters?.length > 0 && data.chapters[0].lessons?.length > 0) {
        setActiveLesson(data.chapters[0].lessons[0])
      }

      // ── View tracking (once per session) ────────────────────────────────
      const sessionKey = `viewed:${courseId}`
      if (!sessionStorage.getItem(sessionKey)) {
        sessionStorage.setItem(sessionKey, "1")
        try { await updateDoc(docRef, { views: increment(1) }) } catch {}
      }

      // ── Check enrollment + ownership ─────────────────────────────────────
      const user = firebaseAuth.currentUser
      if (user) {
        if (data.tutorId === user.uid) { setIsOwnCourse(true) }

        const { collection, query, where, limit, getDocs } = await import("firebase/firestore")
        const eq = query(
          collection(firebaseDb, "enrollments"),
          where("userId", "==", user.uid),
          where("courseId", "==", courseId),
          where("status", "in", ["paid", "free", "completed"]),
          limit(1)
        )
        const snap = await getDocs(eq)
        if (!snap.empty) {
            setIsEnrolled(true)
            const enrData = snap.docs[0].data()
            setEnrollmentId(snap.docs[0].id)
            if (enrData.completedLessons) {
                setCompletedLessons(enrData.completedLessons)
            }
        }
      }
    } catch (error) {
      console.error("Error fetching course:", error)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(() => { fetchData() })
    return () => unsubscribe()
  }, [fetchData])
  
  // ── Time gating for lesson completion ─────────────────────────────────────
  useEffect(() => {
    if (!activeLesson) return
    
    // If already complete, allow passing freely
    if (completedLessons.includes(activeLesson.id)) {
        setCanMarkComplete(true)
        return
    }

    setCanMarkComplete(false)
    setTimeLeft(5)
    
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer)
                setCanMarkComplete(true)
                return 0
            }
            return prev - 1
        })
    }, 1000)

    return () => clearInterval(timer)
  }, [activeLesson, completedLessons])

  // ── PayHere purchase ───────────────────────────────────────────────────────
  const handlePurchase = async () => {
    const user = firebaseAuth.currentUser
    if (!user) { toast.error("Please log in to purchase this course."); return }

    setPurchasing(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/payhere/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          toast.success("You are already enrolled!"); setIsEnrolled(true); return
        }
        throw new Error(data.error ?? "Checkout failed")
      }

      // Free enroll handled server-side
      if (data.enrolled && data.free) {
        toast.success("You are now enrolled for free!")
        await fetchData()
        return
      }

      // PayHere popup
      if (!window.payhere) { toast.error("Payment system not loaded. Please refresh."); return }

      window.payhere.sandbox = data.sandbox ?? true
      window.payhere.onCompleted = async (orderId: string) => {
        console.log("PayHere completed:", orderId)
        // In sandbox: call local confirm endpoint (no ngrok needed)
        // In production: the notify_url webhook handles this automatically
        if (data.sandbox) {
          try {
            const t = await firebaseAuth.currentUser!.getIdToken()
            await fetch("/api/payhere/sandbox-confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
              body: JSON.stringify({ orderId }),
            })
          } catch (e) {
            console.error("Sandbox confirm error:", e)
          }
        }
        toast.success("Payment successful! Granting access…")
        setTimeout(() => fetchData(), 1500)
      }
      window.payhere.onDismissed = () => {
        toast.error("Payment was dismissed.")
        setPurchasing(false)
      }
      window.payhere.onError = (error: string) => {
        toast.error(`Payment error: ${error}`)
        setPurchasing(false)
      }

      const payment: Record<string, string> = {
        sandbox:       String(data.sandbox ?? "true"),
        merchant_id:   data.merchant_id,
        return_url:    data.return_url,
        cancel_url:    data.cancel_url,
        notify_url:    data.notify_url,
        order_id:      data.order_id,
        items:         data.items,
        amount:        data.amount,
        currency:      data.currency,
        hash:          data.hash,
        first_name:    data.first_name,
        last_name:     data.last_name,
        email:         data.email,
        phone:         data.phone,
        address:       data.address,
        city:          data.city,
        country:       data.country,
      }
      window.payhere.startPayment(payment)
    } catch (error: any) {
      toast.error(error.message ?? "Something went wrong")
      setPurchasing(false)
    }
  }

  // ── Gamification Progression ────────────────────────────────────────────────
  const handleMarkComplete = async () => {
    if (!activeLesson || !enrollmentId) {
      toast.error("No enrollment ID - please re-enroll first")
      return
    }
    
    const lessonId = activeLesson.id
    if (completedLessons.includes(lessonId)) return
    
    // Optimistic UI updates
    setCompletedLessons(prev => [...prev, lessonId])
    setMarkingComplete(true)
    
    const totalLessons = chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0)
    const newCompletedLessons = [...completedLessons, lessonId]
    const isCourseCompleted = newCompletedLessons.length >= totalLessons
    const userId = firebaseAuth.currentUser?.uid

    try {
      const { doc, updateDoc, setDoc, getDoc, arrayUnion } = await import("firebase/firestore")

      // 1. Update enrollment document
      const enrRef = doc(firebaseDb, "enrollments", enrollmentId)
      const enrUpdates: any = { completedLessons: arrayUnion(lessonId) }
      if (isCourseCompleted) {
        enrUpdates.status = "completed"
        enrUpdates.completedAt = new Date().toISOString()
      }
      await updateDoc(enrRef, enrUpdates)

      // 2. Grant XP and recalculate tier
      const XP_PER_LESSON = 10
      if (userId) {
        const userRef = doc(firebaseDb, "users", userId)
        const userSnap = await getDoc(userRef)
        const currentXp = userSnap.exists() ? (userSnap.data()?.careerXp || 0) : 0
        const newXp = currentXp + XP_PER_LESSON
        const newTier = newXp >= 1000 ? "Master" : newXp >= 500 ? "Scholar" : newXp >= 100 ? "Explorer" : "Novice"
        await setDoc(userRef, { careerXp: newXp, tier: newTier }, { merge: true })
        toast.success(`✅ +${XP_PER_LESSON} XP Earned! (${newXp} total)`)
      }

      // 3. Save badge if course completed
      if (isCourseCompleted && userId) {
        const badgeRef = doc(firebaseDb, "users", userId, "badges", courseId)
        const badgeSnap = await getDoc(badgeRef)
        if (!badgeSnap.exists()) {
          await setDoc(badgeRef, {
            courseId,
            courseTitle: (course as any).title || "Course",
            earnedAt: new Date().toISOString(),
          })
        }
        toast.success("🏆 Course Completed! Badge Unlocked!", { duration: 5000 })
      }

    } catch (err: any) {
      console.error("[handleMarkComplete] Firestore write failed:", err)
      toast.error(`Could not save progress: ${err.message}`)
      // Roll back optimistic update
      setCompletedLessons(prev => prev.filter(id => id !== lessonId))
    }
    
    setMarkingComplete(false)
    
    // Auto advance to next lesson
    let foundCurrent = false
    for (const chapter of chapters) {
        for (const lesson of chapter.lessons) {
            if (foundCurrent) { setActiveLesson(lesson); return }
            if (lesson.id === activeLesson.id) foundCurrent = true
        }
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  if (!course) return (
    <div className="flex flex-col items-center justify-center p-12">
      <h1 className="text-xl font-semibold">Course not found</h1>
      <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
    </div>
  )

  const chapters: Chapter[] = course.chapters || []
  const isFree = !course.price || course.price === 0
  const hasAccess = isEnrolled

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col animate-in fade-in-50 duration-500">

      {/* PayHere JS SDK */}
      <Script
        src="https://www.payhere.lk/lib/payhere.js"
        strategy="lazyOnload"
        onLoad={() => setPayhereReady(true)}
      />

      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
          <span className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </span>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight truncate flex-1">{course.title}</h1>
        {course.views != null && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Eye className="h-3.5 w-3.5" />
            {course.views.toLocaleString()} views
          </span>
        )}
        <ReportDialog courseId={course.id} courseTitle={course.title} />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-2">
          {hasAccess ? (
            // ── Enrolled / free / own course: show lesson ──────────────────
            activeLesson ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                  {(() => {
                    const getYouTubeEmbedUrl = (url: string) => {
                      try {
                        if (url.includes("watch?v=")) return `https://www.youtube.com/embed/${url.split("watch?v=")[1].split("&")[0]}`
                        if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1].split("?")[0]}`
                        if (url.includes("embed/")) return url
                        return null
                      } catch { return null }
                    }
                    const embedUrl = getYouTubeEmbedUrl(activeLesson.videoUrl || "")
                    return embedUrl ? (
                      <iframe src={embedUrl} className="w-full h-full" title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                        <MonitorPlay className="h-16 w-16 mb-4 opacity-50" />
                        <p>Invalid Video URL</p>
                      </div>
                    )
                  })()}
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {activeLesson.title}
                      {activeLesson.duration && <span className="text-sm font-normal text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {activeLesson.duration} min</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert max-w-none text-sm">
                    <p className="whitespace-pre-wrap">{activeLesson.content || activeLesson.description || "No content added yet."}</p>
                    
                    {/* Mark as Complete Button */}
                    {isEnrolled && enrollmentId && !completedLessons.includes(activeLesson.id) && (
                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <Button
                                onClick={handleMarkComplete}
                                disabled={markingComplete || !canMarkComplete}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm hover:shadow"
                            >
                                {markingComplete ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                {canMarkComplete ? "Mark as Complete & Continue" : `Reading... (${timeLeft}s remaining)`}
                            </Button>
                        </div>
                    )}
                    {isEnrolled && enrollmentId && completedLessons.includes(activeLesson.id) && (
                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <Button disabled variant="outline" className="text-emerald-600 border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/20">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Completed
                            </Button>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 border rounded-lg bg-muted/10">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                <div>
                  <h2 className="text-xl font-semibold">Welcome to the Course</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">Select a lesson from the curriculum to start learning.</p>
                </div>
              </div>
            )
          ) : (
            // ── Not enrolled: purchase wall ─────────────────────────────────
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8 border rounded-lg bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
              <div className="h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Lock className="h-10 w-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{course.title}</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">{course.description}</p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="text-3xl font-bold text-indigo-400">
                  {course.price > 0 ? `LKR ${course.price.toLocaleString()}` : "Free"}
                </div>
                {course.price > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tutor receives LKR {(course.price * 0.95).toFixed(2)} · Platform fee LKR {(course.price * 0.05).toFixed(2)}
                  </p>
                )}
                <Button
                  size="lg"
                  className="mt-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white min-w-[200px]"
                  onClick={handlePurchase}
                  disabled={purchasing || (!payhereReady && course.price > 0 && !isOwnCourse)}
                >
                  {purchasing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                  ) : (
                    <><ShoppingCart className="mr-2 h-4 w-4" /> {isOwnCourse ? "Test Gamification (Enrolls Free)" : isFree ? "Enroll Free" : `Buy — LKR ${course.price}`}</>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Secure payment via PayHere · Instant access after purchase
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Curriculum */}
        <div className="lg:col-span-1 border rounded-lg bg-card flex flex-col overflow-hidden max-h-[calc(100vh-100px)]">
          <div className="p-4 border-b bg-muted/5">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Course Content
            </h3>
            {isEnrolled && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-500 mt-1">
                <CheckCircle2 className="h-3 w-3" /> Enrolled
              </span>
            )}
          </div>
          {/* Progress Bar Display */}
          {isEnrolled && chapters.length > 0 && (
             <div className="px-4 py-3 bg-muted/10 border-b">
                <div className="flex justify-between items-center text-xs font-medium text-muted-foreground mb-1.5">
                    <span>Course Progress</span>
                    <span>{completedLessons.length} / {chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0)}</span>
                </div>
                <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, (completedLessons.length / chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0)) * 100)}%` }} />
                </div>
                {completedLessons.length > 0 && completedLessons.length === chapters.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0) && firebaseAuth.currentUser?.uid && (
                    <Button asChild size="sm" variant="outline" className="w-full text-emerald-600 border-emerald-200 mt-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-800">
                        <Link href={`/badges/${firebaseAuth.currentUser.uid}/${courseId}`} target="_blank">
                            <Award className="w-4 h-4 mr-2" />
                            View Course Badge
                        </Link>
                    </Button>
                )}
             </div>
          )}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {chapters.length > 0 ? (
                <Accordion type="multiple" defaultValue={[chapters[0]?.id]} className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-md px-2">
                      <AccordionTrigger className="hover:no-underline py-2 text-sm font-medium">
                        <div className="flex flex-col items-start text-left">
                          <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Chapter {index + 1}</span>
                          <span>{chapter.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-2">
                        <div className="space-y-1">
                          {chapter.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => hasAccess && setActiveLesson(lesson)}
                              disabled={!hasAccess}
                              className={`w-full flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${
                                !hasAccess ? "opacity-40 cursor-not-allowed" :
                                activeLesson?.id === lesson.id
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {!hasAccess ? <Lock className="h-4 w-4 shrink-0" /> :
                               lesson.videoUrl ? <PlayCircle className="h-4 w-4 shrink-0" /> : <BookOpen className="h-4 w-4 shrink-0" />}
                              <span className="truncate flex-1 text-left">{lesson.title}</span>
                              {completedLessons.includes(lesson.id) && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mx-1" />
                              )}
                              {lesson.duration && <span className="text-[10px] opacity-70 shrink-0">{lesson.duration}m</span>}
                            </button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No specific curriculum added.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
