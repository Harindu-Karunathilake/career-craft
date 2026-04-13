"use client";

import { useEffect, useState } from "react";
import { Loader2, Mic, MicOff, Bot, Square } from "lucide-react";
import CodeEditor from "./code-editor";
import ChatInterface from "./chat-interface";
import Timer from "./timer";
import { doc, onSnapshot, updateDoc, collection, addDoc } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { useTutorStore } from "@/hooks/use-tutor-store";
import { startAITutor, stopAITutor, setAITutorMuted, syncCodeContextWithAI } from "@/lib/vapi-tutor";
import { useCodeAnalysis } from "@/hooks/use-code-analysis";
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';

interface CodingInterviewSessionProps {
    sessionId: string;
    interviewData: any;
}

export default function CodingInterviewSession({ sessionId, interviewData }: CodingInterviewSessionProps) {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<any[]>(interviewData.messages || []);
    const [code, setCode] = useState(interviewData.code || "// Write your solution here\n");
    const [fallbackStartTime] = useState(() => Date.now());
    const [lastTypingTime, setLastTypingTime] = useState(Date.now());
    
    // LiveKit State
    const [lkToken, setLkToken] = useState("");
    const lkServerUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    // AI Tutor State
    const { isAIActive, isMuted, agentStatus } = useTutorStore();
    const { analyzeCode, isAnalyzing } = useCodeAnalysis();

    useEffect(() => {
        const fetchLkToken = async () => {
            try {
                const username = "User_" + Math.floor(Math.random() * 1000);
                const res = await fetch(`/api/livekit/token?room=${sessionId}&username=${username}`);
                const data = await res.json();
                if (data.token) {
                    setLkToken(data.token);
                }
            } catch (e) {
                console.error("LiveKit token not available", e);
            }
        };
        fetchLkToken();
    }, [sessionId]);

    useEffect(() => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) return;

        const unsubscribe = onSnapshot(doc(firebaseDb, "users", userId, "interviews", sessionId), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if ((!data.messages || data.messages.length === 0) && data.questions && data.questions.length > 0) {
                     const firstQuestion = data.questions[0];
                     try {
                         await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                             messages: [{
                                 role: 'ai',
                                 content: `Welcome! Here is your first problem:\n\n${firstQuestion}`,
                                 timestamp: Date.now()
                             }],
                             currentQuestionIndex: 0
                         });
                     } catch (e) {
                         console.error("Failed to inject first question", e);
                     }
                } else if (data.messages) {
                    setMessages(data.messages);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId]);

    // Track AI messages from Zustand and store in Firebase Logs
    useEffect(() => {
        const storeMessages = useTutorStore.getState().messages;
        if (storeMessages.length > 0) {
            const lastMsg = storeMessages[storeMessages.length - 1];
            // Only add to firestore if it's new (prevent duplicate saves by checking timestamp roughly)
            const userId = firebaseAuth.currentUser?.uid;
            if (userId) {
                addDoc(collection(firebaseDb, "users", userId, "interviews", sessionId, "session_logs"), {
                    ...lastMsg,
                    codeSnapshot: code,
                    savedAt: Date.now()
                }).catch(e => console.error("Firebase log error", e));
            }
        }
    }, [useTutorStore.getState().messages]);

    // Auto-save logic
    useEffect(() => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId || !code) return;

        const saveTimeout = setTimeout(async () => {
             try {
                await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                    code: code
                });
             } catch (err) {
                 console.error("Auto-save failed", err);
             }
        }, 10000);

        return () => clearTimeout(saveTimeout);
    }, [code, sessionId]);

    // AI Context Sync (Stuck User)
    useEffect(() => {
        const interval = setInterval(async () => {
            const timeSinceLastTyping = Date.now() - lastTypingTime;
            if (isAIActive && timeSinceLastTyping > 30000) { // 30s
                const currentQuestion = interviewData?.questions?.[0] || "General programming";
                const hint = await analyzeCode(code, currentQuestion);
                if (hint) {
                    syncCodeContextWithAI(`User seems stuck. Code:\n${code}\nInsight: ${hint}`);
                }
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [isAIActive, lastTypingTime, code, analyzeCode, interviewData]);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        setLastTypingTime(Date.now());
    };

    const handleAskAI = async () => {
        if (!isAIActive) {
            startAITutor(code);
        } else {
            const currentQuestion = interviewData?.questions?.[0] || "General programming";
            const hint = await analyzeCode(code, currentQuestion);
            if (hint) {
                syncCodeContextWithAI(`User explicitly asked for help. Code:\n${code}\nInsight: ${hint}`);
            }
        }
    };

    const handleEndInterview = async () => {
        if (!confirm("Are you sure you want to end the interview early?")) return;

        try {
            const userId = firebaseAuth.currentUser?.uid;
            if (!userId) return;

            stopAITutor();

            await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                status: "completed",
                completedAt: Date.now()
            });
            window.location.href = `/interview/${sessionId}/feedback`;
        } catch (error) {
            console.error("Failed to end interview:", error);
        }
    };

    if (loading) {
       return <div className="flex bg-black h-screen items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    const InnerContent = (
        <div className="flex h-screen w-full bg-black flex-col md:flex-row overflow-hidden">
            {/* Left: Code Editor */}
            <div className="hidden md:flex flex-1 flex-col border-r border-white/10 bg-[#1e1e1e]">
                 <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#252526]">
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-white/80">Main.js</div>
                        <Timer startTime={interviewData.createdAt?.seconds ? interviewData.createdAt.seconds * 1000 : fallbackStartTime} />
                    </div>
                    
                    {/* AI Controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAskAI}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
                                isAIActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30"
                            }`}
                        >
                            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3 w-3" />}
                            {isAIActive ? "AI Connected" : "Ask AI Tutor"}
                        </button>
                        
                        {isAIActive && (
                            <>
                                <button
                                    onClick={() => setAITutorMuted(!isMuted)}
                                    className={`p-1.5 rounded border transition-colors ${isMuted ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"}`}
                                >
                                    {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </button>
                                <button
                                    onClick={stopAITutor}
                                    className="p-1.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                                    title="Stop AI"
                                >
                                    <Square className="h-4 w-4" />
                                </button>
                            </>
                        )}
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
                        onChange={handleCodeChange} 
                    />
                 </div>
            </div>

            {/* Right: Chat / Interviewer */}
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

    // Conditionally wrap with LiveKitRoom if token and server exist
    if (lkToken && lkServerUrl) {
        return (
            <LiveKitRoom
                token={lkToken}
                serverUrl={lkServerUrl}
                connect={true}
                audio={true}
                video={false}
            >
                {InnerContent}
                <RoomAudioRenderer />
            </LiveKitRoom>
        );
    }

    return InnerContent;
}
