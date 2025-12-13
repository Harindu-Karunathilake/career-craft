import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const metrics = [
  { label: "Active users", value: "1,248", change: "+3.2% WoW" },
  { label: "New signups", value: "87", change: "+12 today" },
  { label: "Pending invites", value: "34", change: "5 awaiting approval" },
  { label: "Support tickets", value: "6", change: "2 high priority" },
]

export default function AdminOverviewPage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-white/5 text-white">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{metric.label}</p>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl font-semibold">{metric.value}</CardTitle>
              <p className="text-sm text-white/70">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
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
            <p>• 3 interview reports flagged for review</p>
            <p>• 1 resume template awaiting approval</p>
            <p>• 2 partner accounts pending verification</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
