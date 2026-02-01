import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, Briefcase } from "lucide-react"

interface AnalyticsCardsProps {
  interviewCount: number
  resumeCount: number
}

export function AnalyticsCards({ interviewCount, resumeCount }: AnalyticsCardsProps) {
  const stats = [
    {
      label: "Interviews scheduled",
      value: interviewCount,
      icon: Users,
      helper: "Total interviews"
    },
    {
      label: "Resumes tailored",
      value: resumeCount,
      icon: FileText,
      helper: "Optimized resumes"
    },
    {
      label: "Active applications",
      value: "0",
      icon: Briefcase,
      helper: "Coming soon"
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <Card key={item.label} className="border-white/10 bg-white/5 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-70">
              {item.label}
            </CardTitle>
            <item.icon className="h-4 w-4 text-primary opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-white/50">{item.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
