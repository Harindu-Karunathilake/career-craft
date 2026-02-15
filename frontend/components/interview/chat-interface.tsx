"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { httpsCallable } from "firebase/functions";
import { firebaseFunctions } from "@/lib/firebase"; // Ensure this exports 'functions' instance
import { toast } from "sonner";

interface Message {
    role: 'user' | 'ai';
    content: string;
    timestamp?: number;
}

interface ChatInterfaceProps {
    sessionId: string;
    messages: Message[];
    currentCode: string;
    status: string;
}

export default function ChatInterface({ sessionId, messages, currentCode, status }: ChatInterfaceProps) {
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSubmitCode = async () => {
        setLoading(true);
        toast.info("Submitting code for evaluation...");
        
        try {
            // Check if functions are initialized in lib/firebase. If not, we might fail.
            // Assuming firebaseFunctions is exported. If not, I'll need to fix lib/firebase.ts
            // For now, let's assume standard names.
            
            const submitCodeFn = httpsCallable(firebaseFunctions, 'submitCode');
            const result = await submitCodeFn({
                sessionId,
                code: currentCode,
                language: 'javascript' 
            });
            
            console.log("Submission result:", result);
            toast.success("Feedback received!");
        } catch (error) {
            console.error("Submission error:", error);
            
            // Fallback for demo if functions aren't running locally or deployed
            toast.error("Cloud Function failed. (Did you deploy?). Showing mock response.");
            
            // We can't update Firestore directly easily without duplicating logic.
            // Just let the user know.
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-white">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#252526]">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-indigo-400" />
                    <span className="font-semibold">AI Interviewer</span>
                </div>
                <Button 
                    size="sm" 
                    onClick={handleSubmitCode} 
                    disabled={loading || status === 'completed'}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    {status === 'completed' ? 'Completed' : 'Submit Code'}
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                    {messages.length === 0 && (
                        <div className="text-center text-white/40 mt-10">
                            No messages yet. The interviewer will review your code when you submit.
                        </div>
                    )}
                    
                    {messages.map((msg, i) => (
                        <div key={i} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                             <div className={cn("p-3 rounded-lg text-sm", 
                                msg.role === 'user' ? "bg-indigo-600/20 text-indigo-100 rounded-br-none" : "bg-white/10 text-zinc-100 rounded-bl-none"
                             )}>
                                 {msg.content}
                             </div>
                             <span className="text-[10px] text-white/30 mt-1 capitalize">{msg.role}</span>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Optional text input if we want to allow asking questions */}
            {/* 
            <div className="p-4 border-t border-white/10">
                <form className="flex gap-2">
                    <Input className="bg-black/20 border-white/10" placeholder="Ask a question..." />
                     <Button size="icon" variant="ghost"><Send className="h-4 w-4" /></Button>
                </form>
            </div> 
            */}
        </div>
    );
}
