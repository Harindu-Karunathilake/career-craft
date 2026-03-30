"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { firebaseAuth, firebaseDb } from "@/lib/firebase"
import { AnalyticsCards } from "@/components/dashboard/analytics-cards"
import { ProgressChart } from "@/components/dashboard/progress-chart"
import { ScoreChart } from "@/components/dashboard/score-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, Variants } from "framer-motion"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

export default function UserOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [interviewCount, setInterviewCount] = useState(0)
  const [resumeCount, setResumeCount] = useState(0)
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([])
  const [scoreData, setScoreData] = useState<{ date: string; score: number; role: string }[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const user = firebaseAuth.currentUser
        if (!user) {
         setLoading(false)
         return
        }

      try {
        // Fetch Interviews
        const interviewsRef = collection(firebaseDb, "users", user.uid, "interviews")
        const interviewsSnapshot = await getDocs(query(interviewsRef))
        const interviews = interviewsSnapshot.docs.map(doc => doc.data())
        setInterviewCount(interviews.length)

        // Fetch Resumes
        const resumesRef = collection(firebaseDb, "users", user.uid, "resumes")
        const resumesSnapshot = await getDocs(query(resumesRef))
        const resumes = resumesSnapshot.docs.map(doc => doc.data())
        setResumeCount(resumes.length)

        // Process Chart Data
        const activityMap = new Map<string, number>()
        const scores: { date: string; score: number; role: string; timestamp: number }[] = []
        
        // Helper to count activity by date
        const processActivity = (items: any[], type: "interview" | "resume") => {
            items.forEach(item => {
                if (item.createdAt) {
                    let dateObj: Date | null = null;

                    // Handle Firestore Timestamp
                    if (item.createdAt?.seconds) {
                        dateObj = new Date(item.createdAt.seconds * 1000)
                    } 
                    // Handle JS Date or ISO String
                    else if (item.createdAt instanceof Date) {
                        dateObj = item.createdAt
                    }
                    else if (typeof item.createdAt === 'string') {
                         dateObj = new Date(item.createdAt)
                    }

                    // Check if valid
                    if (dateObj && !isNaN(dateObj.getTime())) {
                        const date = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        activityMap.set(date, (activityMap.get(date) || 0) + 1)

                        // Process Scores for Interviews
                        if (type === "interview" && item.feedback?.totalScore) {
                            scores.push({
                                date,
                                score: item.feedback.totalScore,
                                role: item.role || "Mock Interview",
                                timestamp: dateObj.getTime() / 1000
                            })
                        }
                    }
                }
            })
        }

        processActivity(interviews, "interview")
        processActivity(resumes, "resume")

        // Convert Map to Array and Sort
        const sortedData = Array.from(activityMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            
        setChartData(sortedData)

        // Sort Scores by Date
        const sortedScores = scores
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(({ date, score, role, timestamp }) => ({ date, score, role, timestamp }))
        
        setScoreData(sortedScores)

      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    // Listen for auth state
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
            fetchData()
        } else {
            setLoading(false)
        }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div className="p-8 text-white">Loading dashboard...</div>
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 relative z-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <p className="text-white/60">Overview of your career progress.</p>
      </motion.div>

      <AnalyticsCards interviewCount={interviewCount} resumeCount={resumeCount} />

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants} className="h-full">
          <ScoreChart data={scoreData} />
        </motion.div>
        <motion.div variants={itemVariants} className="h-full">
          <ProgressChart data={chartData} />
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.05),transparent_50%)]" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-semibold tracking-tight text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-8">
                {/* Static Placeholder for "Recent Activity" feed */}
                <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-4" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium leading-none text-white">System Ready</p>
                        <p className="text-sm text-white/50">Analytics modules loaded flawlessly.</p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
