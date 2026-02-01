import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, AlertCircle, ShieldCheck } from "lucide-react"

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
        <Card key={item.label} className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-70">
              {item.label}
            </CardTitle>
            <item.icon className="h-4 w-4 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-white/50">{item.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
