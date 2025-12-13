import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stats = [
  { label: "Active applications", value: "12", helper: "3 need follow-up" },
  { label: "Interviews scheduled", value: "4", helper: "Next loop in 2 days" },
  { label: "Resumes tailored", value: "5", helper: "Last updated yesterday" },
  { label: "Mentor feedback", value: "8", helper: "2 unread notes" },
]

export default function UserOverviewPage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="border-white/10 bg-white/5 text-white">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{item.label}</p>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-3xl font-semibold">{item.value}</CardTitle>
              <p className="text-sm text-white/70">{item.helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>Pipeline health</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70">
              Keep a steady flow of applications each week. Highlight the top three roles you want to push forward and
              add notes after every interview to capture momentum.
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle>This week&apos;s plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/80">
            <ul className="space-y-2">
              <li>• Send follow-up to Atlas Bio recruiter</li>
              <li>• Prep system design prompt for Lumina Cloud</li>
              <li>• Share resume update with mentor Mara</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
