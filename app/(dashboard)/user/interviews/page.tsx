import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const interviews = [
  {
    company: "Lumina Cloud",
    role: "Staff SWE",
    date: "Dec 5",
    stage: "Architecture review",
  },
  {
    company: "Northstar Robotics",
    role: "Sr PM",
    date: "Dec 7",
    stage: "Loop day",
  },
  {
    company: "Atlas Bio",
    role: "Lead DS",
    date: "Dec 12",
    stage: "Debrief",
  },
]

export default function UserInterviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Interviews</p>
        <h1 className="text-2xl font-semibold text-white">Upcoming loops & feedback</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {interviews.map((interview) => (
          <Card key={interview.company} className="border-white/10 bg-white/5 text-white">
            <CardHeader>
              <CardTitle>{interview.company}</CardTitle>
              <CardDescription className="text-white/70">{interview.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-white/80">
              <p>Stage: {interview.stage}</p>
              <p>Date: {interview.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
