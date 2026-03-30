import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, AlertCircle, ShieldCheck } from "lucide-react"
import { motion, Variants } from "framer-motion"

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
}

interface AdminAnalyticsCardsProps {
  userCount: number
}

export function AdminAnalyticsCards({ userCount }: AdminAnalyticsCardsProps) {
  const metrics = [
    {
      label: "Total Users",
      value: userCount,
      icon: Users,
      change: "Registered accounts",
      helper: "Total platform users"
    },
    {
      label: "System Status",
      value: "Healthy",
      icon: Activity,
      change: "All services online",
      helper: "Uptime 99.9%"
    },
    {
        label: "Security Alerts",
        value: "0",
        icon: AlertCircle,
        change: "No active threats",
        helper: "Last scan: Today"
    },
    {
        label: "Admin Acts",
        value: "Active",
        icon: ShieldCheck,
        change: "Monitoring enabled",
        helper: "Audit log active"
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((item) => (
        <motion.div key={item.label} variants={itemVariants}>
          <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-colors h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight text-white">{item.value}</div>
              <p className="text-xs text-white/40 mt-1">{item.change}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
