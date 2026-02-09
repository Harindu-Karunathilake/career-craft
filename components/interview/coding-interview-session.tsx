"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CodeEditor from "./code-editor";
import ChatInterface from "./chat-interface";
import Timer from "./timer";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
// Actually, I'll use a simple timeout for autosave logic inside useEffect since I don't want to rely on unknown hooks.

interface CodingInterviewSessionProps {
    sessionId: string;
    interviewData: any;
}

export default function CodingInterviewSession({ sessionId, interviewData }: CodingInterviewSessionProps) {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>(interviewData.messages || []);
    const [code, setCode] = useState(interviewData.code || "// Write your solution here\n");

    useEffect(() => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) return;

        // Listen for real-time updates (AI responses, status changes)
        const unsubscribe = onSnapshot(doc(firebaseDb, "users", userId, "interviews", sessionId), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // If we have questions but no messages, inject the first question
                if ((!data.messages || data.messages.length === 0) && data.questions && data.questions.length > 0) {
                     const firstQuestion = data.questions[0];
                     // We need to update the DB, not just local state, so it persists
                     // Use a flag or check to prevent infinite loops (though length === 0 check handles it)
                     try {
                         await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                             messages: [{
                                 role: 'ai',
                                 content: `Welcome! Here is your first problem:\n\n${firstQuestion}`,
                                 timestamp: Date.now()
                             }],
                             currentQuestionIndex: 0
                         });
                         // No need to setMessages here, the snapshot listener will fire again with the new data
                     } catch (e) {
                         console.error("Failed to inject first question", e);
                     }
                } else if (data.messages) {
                    setMessages(data.messages);
                }
            }
        });

        setLoading(false);
        return () => unsubscribe();
    }, [sessionId]);

    // Auto-save logic
    useEffect(() => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId || !code) return;

        const saveTimeout = setTimeout(async () => {
             try {
                // Only save if changed (simple check? No, Firestore write is cheap enough for 10s debounce)
                // Actually, code changes on every keystroke.
                // We should check if it's different from what we loaded? 
                // For now, just save.
                await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                    code: code
                });
                console.log("Auto-saved code");
             } catch (err) {
                 console.error("Auto-save failed", err);
             }
        }, 10000); // 10 seconds debounce

        return () => clearTimeout(saveTimeout);
    }, [code, sessionId]);

    const handleEndInterview = async () => {
        if (!confirm("Are you sure you want to end the interview early?")) return;
        
        try {
            const userId = firebaseAuth.currentUser?.uid;
            if (!userId) return;

            await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                status: "completed",
                completedAt: Date.now()
            });
            
            // The snapshot listener will pick up the status change/redirect, or we can force it
            window.location.href = `/interview/${sessionId}/feedback`;
        } catch (error) {
            console.error("Failed to end interview:", error);
        }
    };

    if (loading) {
       return <div className="flex bg-black h-screen items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="flex h-screen w-full bg-black flex-col md:flex-row overflow-hidden">
            {/* Left: Code Editor (60%) */}
            <div className="hidden md:flex flex-1 flex-col border-r border-white/10 bg-[#1e1e1e]">
                 <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#252526]">
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-white/80">Main.js</div>
                        <Timer startTime={interviewData.createdAt?.seconds ? interviewData.createdAt.seconds * 1000 : Date.now()} />
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="text-xs text-white/40">Auto-saving...</div>
                         <button 
                            onClick={handleEndInterview}
                            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1 rounded border border-red-500/20 transition-colors"
                         >
                            End Interview
                         </button>
                    </div>
                 </div>
                 <div className="flex-1 overflow-hidden relative">
                    <CodeEditor 
                        initialCode={code} 
                        sessionId={sessionId} 
                        onChange={(newCode) => setCode(newCode)} 
                    />
                 </div>
            </div>

            {/* Right: Chat / Interviewer (40%) */}
            <div className="w-full md:w-[450px] flex flex-col bg-zinc-900/50 border-l border-white/10 backdrop-blur-sm">
                <ChatInterface 
                    sessionId={sessionId} 
                    messages={messages} 
                    currentCode={code}
                    status={interviewData.status}
                />
            </div>
        </div>
    );
}
