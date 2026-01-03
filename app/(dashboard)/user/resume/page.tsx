import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, CheckCircle, Clock } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

const resumes = [
  {
    id: 1,
    title: "Senior Full Stack Engineer",
    target: "Google",
    atsScore: 92,
    keywords: ["React", "Node.js", "System Design"],
    lastUpdated: "2 mins ago",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600",
    status: "Optimized"
  },
  {
    id: 2,
    title: "Product Manager",
    target: "Uber",
    atsScore: 85,
    keywords: ["Strategy", "Agile", "User Research"],
    lastUpdated: "4 hours ago",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
    status: "Needs Review"
  },
  {
    id: 3,
    title: "AI/ML Engineer",
    target: "OpenAI",
    atsScore: 96,
    keywords: ["PyTorch", "Transformers", "NLP"],
    lastUpdated: "1 day ago",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600",
    status: "Optimized"
  },
  {
    id: 4,
    title: "Engineering Manager",
    target: "Linear",
    atsScore: 78,
    keywords: ["Leadership", "Hiring", "Roadmap"],
    lastUpdated: "3 days ago",
    image: "https://images.unsplash.com/photo-1664575602554-2087b04935a5?auto=format&fit=crop&q=80&w=600",
    status: "Draft"
  },
]

export default function UserResumePage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Resume Vault</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Tailored Versions</h1>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resumes.map((resume) => (
          <Card 
            key={resume.id} 
            className="group overflow-hidden rounded-2xl border-border/50 bg-card/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/20 hover:bg-card"
          >
            <div className="relative h-48 w-full overflow-hidden">
              <Image 
                src={resume.image} 
                alt={resume.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <Badge variant="outline" className="bg-black/40 text-white backdrop-blur-md border-white/20">
                  {resume.target}
                </Badge>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-white/90">ATS Score</span>
                    <Badge 
                        className={`border-none backdrop-blur-md shadow-sm ${
                            resume.atsScore >= 90 ? "bg-emerald-500/90 text-white" : 
                            resume.atsScore >= 80 ? "bg-yellow-500/90 text-black" : 
                            "bg-orange-500/90 text-white"
                        }`}
                    >
                        {resume.atsScore}
                    </Badge>
                </div>
              </div>
            </div>
            
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="text-lg font-semibold leading-tight">{resume.title}</CardTitle>
                    <CardDescription className="text-sm font-medium text-primary mt-1 flex items-center gap-1.5">
                        {resume.status === "Optimized" ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                            <Clock className="h-3.5 w-3.5" />
                        )}
                        <span className={resume.status === "Optimized" ? "text-emerald-600 dark:text-emerald-400" : ""}>
                            {resume.status}
                        </span>
                    </CardDescription>
                 </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 pt-2 space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {resume.keywords.map((keyword) => (
                  <span 
                    key={keyword} 
                    className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-black/5 dark:ring-white/10"
                  >
                    {keyword}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium">
                    Edit
                 </Button>
                 <Button size="sm" className="h-8 w-8 px-0 shrink-0">
                    <Download className="h-3.5 w-3.5" />
                 </Button>
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF • 1.2 MB</span>
                </div>
                <span>{resume.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Add New Mock Card */}
        <button className="group relative flex h-full min-h-[350px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 transition-all hover:border-primary/50 hover:bg-muted/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <span className="text-2xl font-light text-primary">+</span>
            </div>
            <p className="font-medium text-muted-foreground group-hover:text-foreground">Create New Version</p>
        </button>
      </div>
    </div>
  )
}
