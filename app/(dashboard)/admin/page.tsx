"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, collectionGroup } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminAnalyticsCards } from "@/components/dashboard/admin-analytics-cards"
import { DemandingJobsChart } from "@/components/dashboard/demanding-jobs-chart"
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-10 relative z-10">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-bold tracking-tight text-white grid gap-1">Admin Dashboard</h2>
        <p className="text-white/60">System overview and user management.</p>
      </motion.div>

      <AdminAnalyticsCards userCount={userCount} />

      <section className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemVariants} className="h-full">
          <DemandingJobsChart data={jobStats} />
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors h-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_50%)]" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-semibold tracking-tight text-white">Platform health</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 text-sm text-white/70 leading-relaxed">
              All background jobs completed successfully. Monitor scheduled syncs for third-party ATS systems; next run occurs tonight at 11:45 PM PT.
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full lg:col-span-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors h-full">
            <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-semibold tracking-tight text-white">Moderation queue</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4 text-sm text-white/80">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                 <p>0 interview reports flagged for review</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                 <p>0 resume templates awaiting approval</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                 <p>1 partner account pending verification</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </motion.div>
  )
}
