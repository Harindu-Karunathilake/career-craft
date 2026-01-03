import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bot, Phone } from "lucide-react"
import Link from "next/link"

export default function InterviewSetupPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans">
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 px-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-white tracking-tight">Interview Generation</h1>
            <p className="text-muted-foreground">Ready to start your session?</p>
        </div>

        {/* Cards Container */}
        <div className="grid w-full gap-6 md:grid-cols-2 max-w-4xl">
            
            {/* AI Interviewer Card */}
            <Card className="group relative flex aspect-video flex-col items-center justify-center gap-6 overflow-hidden border-white/10 bg-white/5 transition-all duration-300 hover:border-primary/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-white/20 backdrop-blur-3xl transition-transform duration-500 group-hover:scale-110">
                    <Bot className="h-12 w-12 text-indigo-400" />
                    <div className="absolute inset-0 animate-pulse rounded-full bg-indigo-500/20" />
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-medium text-white">AI Interviewer</h3>
                    <div className="mt-2 flex items-center justify-center gap-2">
                         <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-500">Online</span>
                    </div>
                </div>
            </Card>

            {/* User Card */}
            <Card className="group relative flex aspect-video flex-col items-center justify-center gap-6 overflow-hidden border-white/10 bg-white/5 transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                 <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative h-24 w-24 transition-transform duration-500 group-hover:scale-110">
                    <Avatar className="h-full w-full ring-2 ring-white/10 shadow-2xl">
                        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                </div>
                
                <div className="text-center">
                    <h3 className="text-xl font-medium text-white">Harindu</h3>
                     <p className="mt-1 text-sm text-muted-foreground">Candidate</p>
                </div>
            </Card>

        </div>

        {/* Action Button */}
        <div className="mt-8">
            <Button 
                size="lg" 
                className="h-14 min-w-[200px] rounded-full bg-emerald-500 text-lg font-medium text-white shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:bg-emerald-400 hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.6)]"
            >
                Start Call
            </Button>
        </div>

      </div>
    </main>
  )
}
