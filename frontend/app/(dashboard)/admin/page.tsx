"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, collectionGroup } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminAnalyticsCards } from "@/components/dashboard/admin-analytics-cards"
import { DemandingJobsChart } from "@/components/dashboard/demanding-jobs-chart"

export default function AdminOverviewPage() {
  const [userCount, setUserCount] = useState(0)
  const [jobStats, setJobStats] = useState<{ role: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(firebaseDb, "users"))
        setUserCount(usersSnapshot.size)

        // Fetch Interviews for usage stats
        const interviewsSnapshot = await getDocs(collectionGroup(firebaseDb, "interviews"))
        const roleCounts: Record<string, number> = {}
        
        interviewsSnapshot.forEach(doc => {
            const data = doc.data()
            const role = data.role as string || "Unknown"
            roleCounts[role] = (roleCounts[role] || 0) + 1
        })

        const sortedRoles = Object.entries(roleCounts)
            .map(([role, count]) => ({ role, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        setJobStats(sortedRoles)

      } catch (error) {
        console.error("Error fetching admin stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="p-8 text-white">Loading admin dashboard...</div>
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white grid gap-1">Admin Dashboard</h2>
        <p className="text-muted-foreground">System overview and user management.</p>
      </div>

      <AdminAnalyticsCards userCount={userCount} />

      <section className="grid gap-6 lg:grid-cols-2">
        <DemandingJobsChart data={jobStats} />
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Platform health</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            All background jobs completed successfully. Monitor scheduled syncs for third-party ATS systems; next run occurs tonight at 11:45 PM PT.
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Moderation queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/80">
            <p>• 0 interview reports flagged for review</p>
            <p>• 0 resume templates awaiting approval</p>
            <p>• 0 partner accounts pending verification</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
