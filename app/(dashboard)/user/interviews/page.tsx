import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const interviews = [
  {
    id: 1,
    title: "Frontend Developer",
    company: "Lumina Cloud",
    type: "Technical",
    tech: ["React", "TypeScript", "System Design"],
    date: "Today, 2:00 PM",
    duration: "60 min",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600",
    status: "Upcoming"
  },
  {
    id: 2,
    title: "Senior Product Manager", 
    company: "Northstar Robotics",
    type: "Behavioral",
    tech: ["Leadership", "Strategy", "Agile"],
    date: "Tomorrow, 10:00 AM",
    duration: "45 min",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600",
    status: "Scheduled"
  },
  {
    id: 3,
    title: "Backend Engineer",
    company: "Atlas Bio",
    type: "Technical",
    tech: ["Node.js", "PostgreSQL", "AWS"],
    date: "Dec 12, 11:30 AM",
    duration: "60 min",
    image: "https://images.unsplash.com/photo-1555099962-4199c345e5dd?auto=format&fit=crop&q=80&w=600",
    status: "Completed"
  },
  {
    id: 4,
    title: "Full Stack Developer",
    company: "Echo Systems",
    type: "System Design",
    tech: ["Architecture", "Scalability", "Redis"],
    date: "Dec 15, 3:00 PM",
    duration: "90 min",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600",
    status: "Scheduled"
  },
]

export default function UserInterviewsPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">My Interviews</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Upcoming Sessions</h1>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {interviews.map((interview) => (
          <Card 
            key={interview.id} 
            className="group overflow-hidden rounded-2xl border-border/50 bg-card/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20 hover:bg-card"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <Image 
                src={interview.image} 
                alt={interview.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <Badge variant="secondary" className="bg-white/90 text-black backdrop-blur-md shadow-sm border-none font-medium">
                  {interview.type}
                </Badge>
                {interview.status === "Upcoming" && (
                  <Badge className="bg-blue-500/90 hover:bg-blue-500 border-none backdrop-blur-md shadow-sm">
                    In 2 hours
                  </Badge>
                )}
              </div>
            </div>
            
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="text-lg font-semibold leading-tight">{interview.title}</CardTitle>
                    <CardDescription className="text-sm font-medium text-primary mt-1">{interview.company}</CardDescription>
                 </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {interview.tech.map((tech) => (
                  <span 
                    key={tech} 
                    className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-black/5 dark:ring-white/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{interview.date}</span>
                </div>
                <div className="flex items-center gap-1">
                   <Clock className="h-3.5 w-3.5" />
                   <span>{interview.duration}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Add New Mock Card */}
        <button className="group relative flex h-full min-h-[350px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 transition-all hover:border-primary/50 hover:bg-muted/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <span className="text-2xl font-light text-primary">+</span>
            </div>
            <p className="font-medium text-muted-foreground group-hover:text-foreground">Generate New Interview</p>
        </button>
      </div>
    </div>
  )
}
