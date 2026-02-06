"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query } from "firebase/firestore"
import { firebaseAuth, firebaseDb } from "@/lib/firebase"
import { AnalyticsCards } from "@/components/dashboard/analytics-cards"
import { ProgressChart } from "@/components/dashboard/progress-chart"
import { ScoreChart } from "@/components/dashboard/score-chart"
import { RecommendedCourses } from "@/components/dashboard/recommended-courses"
import { RecommendedJobs } from "@/components/dashboard/recommended-jobs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your career progress.</p>
      </div>

      <AnalyticsCards interviewCount={interviewCount} resumeCount={resumeCount} />

      <RecommendedCourses />
      
      <RecommendedJobs />

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreChart data={scoreData} />
        <ProgressChart data={chartData} />
      </div>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
              {/* Static Placeholder for "Recent Activity" feed */}
              <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">System Ready</p>
                      <p className="text-sm text-muted-foreground">Analytics modules loaded.</p>
                  </div>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
