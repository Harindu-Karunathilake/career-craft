import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react"

export default function ResumeAnalyzePage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans py-20">
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      
      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 px-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-white tracking-tight">Resume Analysis</h1>
            <p className="text-muted-foreground">Upload your resume to get AI-powered feedback.</p>
        </div>

        {/* Upload Card */}
        <Card className="w-full overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
             
             {/* Job Details Form */}
             <div className="p-6 pb-0 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="job-title" className="text-white">Job Title</Label>
                        <Input id="job-title" placeholder="e.g. Senior Product Manager" className="bg-black/20 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company" className="text-white">Company Name</Label>
                        <Input id="company" placeholder="e.g. Google" className="bg-black/20 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Job Description</Label>
                    <Textarea 
                        id="description" 
                        placeholder="Paste the job description here..." 
                        className="min-h-[100px] bg-black/20 border-white/10 text-white placeholder:text-white/30 resize-none"
                    />
                </div>
             </div>

             <div className="p-10 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-black/20 m-6 transition-all hover:border-primary/50 hover:bg-white/5 group cursor-pointer">
                <div className="h-16 w-16 mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center transition-transform group-hover:scale-110">
                    <UploadCloud className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Click to upload or drag and drop</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                    PDF, DOCX up to 10MB. We will analyze your resume for keywords, formatting, and impact.
                </p>
             </div>

             <div className="px-6 pb-6 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-500/20">
                        <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">resume_draft_v12.pdf</p>
                        <p className="text-xs text-muted-foreground">1.2 MB</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
             </div>
        </Card>

        {/* Action Button */}
        <div className="w-full flex justify-center">
            <Button 
                size="lg" 
                className="h-12 min-w-[200px] rounded-full bg-indigo-600 text-base font-medium text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)]"
            >
                Start Analysis
            </Button>
        </div>

      </div>
    </main>
  )
}
