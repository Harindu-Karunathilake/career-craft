"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { firebaseAuth } from "@/lib/firebase";
import { toast } from "sonner";

// Lightweight markdown renderer for chat messages
function renderMarkdown(text: string) {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        // Bold: **text**
        const boldParsed = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
        );
        // Bullet points
        if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return <li key={i} className="ml-3 list-none flex gap-1.5"><span className="text-emerald-400 mt-0.5">›</span><span>{boldParsed}</span></li>;
        }
        // Empty line = spacer
        if (line.trim() === '') {
            return <div key={i} className="h-1" />;
        }
        return <p key={i} className="leading-snug">{boldParsed}</p>;
    });
}

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
    // Ref on the ScrollArea's inner viewport (the actual overflow-y container)
    const viewportRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of the chat panel only — never touches window scroll
    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        // requestAnimationFrame ensures the new message has painted before we measure
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }, [messages]);

    const handleSubmitCode = async () => {
        setLoading(true);
        toast.info("Submitting code for evaluation...");
        
        try {
            const userId = firebaseAuth.currentUser?.uid;
            if (!userId) {
                toast.error("You must be logged in to submit.");
                return;
            }

            const response = await fetch('/api/submit-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    code: currentCode,
                    language: 'javascript',
                    userId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Evaluation failed');
            }

            console.log("Submission result:", result);
            toast.success("Feedback received!");
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || "Failed to evaluate code. Please try again.");
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

            {/* Plain overflow div — direct ref access for scrollTop, no page scroll bleed */}
            <div ref={viewportRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {messages.length === 0 && (
                    <div className="text-center text-white/40 mt-10">
                        No messages yet. The interviewer will review your code when you submit.
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col max-w-[90%]", msg.role === 'user' ? "self-end items-end" : "self-start items-start")}>
                         <div className={cn("p-3 rounded-lg text-sm space-y-0.5", 
                            msg.role === 'user' ? "bg-indigo-600/20 text-indigo-100 rounded-br-none" : "bg-white/5 border border-white/10 text-zinc-100 rounded-bl-none"
                         )}>
                             {msg.role === 'ai' ? renderMarkdown(msg.content) : msg.content}
                         </div>
                         <span className="text-[10px] text-white/30 mt-1 capitalize">{msg.role === 'ai' ? 'AI Interviewer' : 'You'}</span>
                    </div>
                ))}
            </div>

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
