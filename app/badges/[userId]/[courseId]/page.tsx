import { adminDb } from "@/lib/firebase-admin"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { Award, CheckCircle, Linkedin, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BadgePageProps {
  params: Promise<{
    userId: string
    courseId: string
  }>
}

// ── Shared Function to fetch or build badge ────────────────────────────────
async function getBadgeData(userId: string, courseId: string) {
  const db = adminDb()
  const userDoc = await db.collection("users").doc(userId).get()
  
  const user = userDoc.exists ? userDoc.data()! : {}
  const userName = user.name || user.displayName || "A Learner"

  // 1. Check explicit badges collection
  const badgeDoc = await db.collection(`users/${userId}/badges`).doc(courseId).get()
  if (badgeDoc.exists) {
    console.log(`[Badge] Found direct badge doc for ${userId}`);
    return { user, userName, badge: badgeDoc.data()! }
  }

  // 2. Fallback: Check if they are 100% completed in enrollments
  const enrollments = await db.collection("enrollments")
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get()
    
  if (!enrollments.empty) {
    const enr = enrollments.docs[0].data()
    const courseDoc = await db.collection("courses").doc(courseId).get()
    const course = courseDoc.data()
    
    if (!course) {
        console.log(`[Badge] 404: Course document ${courseId} missing`);
        return null;
    }

    const totalLessons = course.chapters?.reduce((sum: number, ch: any) => sum + (ch.lessons?.length || 0), 0) || 0
    const completedCount = enr.completedLessons?.length || 0
    
    console.log(`[Badge Fallback] userId: ${userId}, status: ${enr.status}, completed progress: ${completedCount}/${totalLessons}`)

    const isCompleted = enr.status === "completed" || (totalLessons > 0 && completedCount >= totalLessons)

    if (isCompleted) {
      return {
        user,
        userName,
        badge: {
          courseId,
          courseTitle: course.title || "Course",
          earnedAt: enr.completedAt || new Date().toISOString()
        }
      }
    } else {
        console.log(`[Badge] 404: Course not completely finished by the student.`);
    }
  } else {
      console.log(`[Badge] 404: No enrollment record found for this user/course combination.`);
  }

  return null
}

// ── OpenGraph Metadata Generation ──────────────────────────────────────────
export async function generateMetadata({ params }: BadgePageProps): Promise<Metadata> {
  const resolvedParams = await params
  const { userId, courseId } = resolvedParams

  try {
    const data = await getBadgeData(userId, courseId)
    if (!data) return { title: "Badge Not Found" }

    const { userName, badge } = data

    return {
      title: `${userName} completed ${badge.courseTitle}`,
      description: `Verify ${userName}'s achievement on Career Craft.`,
      openGraph: {
        title: `${userName} earned a Course Badge!`,
        description: `Successfully completed: ${badge.courseTitle}`,
        images: [`/og-badge.png`], 
        type: 'website',
      },
      twitter: {
        card: "summary_large_image",
        title: `${userName} completed ${badge.courseTitle}`,
        description: `Verified Course Completion on Career Craft.`,
      }
    }
  } catch (_error) {
    return { title: "Course Badge" }
  }
}

// ── Main Page Component ────────────────────────────────────────────────────
export default async function BadgePage({ params }: BadgePageProps) {
  const resolvedParams = await params
  const { userId, courseId } = resolvedParams

  const data = await getBadgeData(userId, courseId)

  if (!data) {
    return notFound()
  }

  const { userName, badge } = data
  const dateStr = new Date(badge.earnedAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  // Determine full URL for sharing
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const shareUrl = `${appUrl}/badges/${userId}/${courseId}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6 py-20 font-sans">
      
      <div className="max-w-2xl w-full">
        {/* Certificate Container */}
        <div className="bg-white dark:bg-zinc-950 border shadow-2xl rounded-2xl overflow-hidden relative text-center pb-12 pt-16 px-8 select-none">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-indigo-500" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Badge Icon */}
          <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-emerald-50 dark:bg-emerald-950 mb-8 border border-emerald-100 dark:border-emerald-800 shadow-sm">
            <Award className="w-16 h-16 text-emerald-500" />
            <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 border shadow-sm">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4 font-serif">
            Certificate of Completion
          </h1>
          
          <p className="text-lg text-muted-foreground mb-2">
            This certifies that
          </p>
          
          <h2 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-8">
            {userName}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-2">
            has successfully completed the course
          </p>
          
          <h3 className="text-2xl font-bold mb-10 max-w-xl mx-auto leading-snug">
            {badge.courseTitle}
          </h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-muted-foreground mt-4">
            <div className="flex flex-col items-center">
              <span className="font-medium text-foreground">Awarded on</span>
              <span>{dateStr}</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="font-medium text-foreground">Credential ID</span>
              <span className="font-mono text-xs">{badge.courseId.slice(0, 10).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Sharing Actions Below Certificate */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
           <Button asChild size="lg" className="bg-[#0A66C2] hover:bg-[#004182] text-white transition-colors w-full sm:w-auto">
             <Link href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                <Linkedin className="w-4 h-4 mr-2 fill-current" />
                Add to LinkedIn Profile
             </Link>
           </Button>

           <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href={shareUrl}>
                 <Share2 className="w-4 h-4 mr-2" /> View Public Link
              </Link>
           </Button>
        </div>
      </div>

    </div>
  )
}
