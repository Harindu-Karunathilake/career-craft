"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Bot, Square, AlertTriangle } from "lucide-react";
import CodeEditor from "./code-editor";
import ChatInterface from "./chat-interface";
import Timer from "./timer";
import { doc, onSnapshot, updateDoc, collection, addDoc } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { useTutorStore } from "@/hooks/use-tutor-store";
import { startAITutor, stopAITutor, setAITutorMuted, syncCodeContextWithAI, notifyNextProblem } from "@/lib/vapi-tutor";
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
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(interviewData.currentQuestionIndex || 0);
    const [fallbackStartTime] = useState(() => Date.now());
    const [lastTypingTime, setLastTypingTime] = useState(() => Date.now());
    const [showEndModal, setShowEndModal] = useState(false);
    // Track last processed message count to detect newly-added Next Problem messages
    const lastMessageCountRef = useRef<number>(interviewData.messages?.length || 0);
    
    // LiveKit State
    const [lkToken, setLkToken] = useState("");
    const lkServerUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    // AI Tutor State
    const { isAIActive, isMuted } = useTutorStore();
    const { analyzeCode, isAnalyzing } = useCodeAnalysis();
    // Track previous code to avoid syncing unchanged content
    const lastSyncedCodeRef = useRef<string>("");

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

                // --- Bootstrap first question ---
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
                    const newMessages: any[] = data.messages;
                    const newIdx: number = data.currentQuestionIndex ?? 0;

                    // Detect a newly-arrived AI message that contains the next problem
                    // and notify the live VAPI agent so it reads it aloud.
                    if (newMessages.length > lastMessageCountRef.current) {
                        const newAiMessages = newMessages.slice(lastMessageCountRef.current);
                        for (const msg of newAiMessages) {
                            if (msg.role === 'ai' && typeof msg.content === 'string') {
                                const nextProblemMatch = msg.content.match(/\*\*Next Problem:\*\*\n([\s\S]+?)$/m);
                                if (nextProblemMatch) {
                                    const nextQuestion = nextProblemMatch[1].trim();
                                    // Pass current code so auto-restart has full context
                                    setTimeout(() => notifyNextProblem(nextQuestion, code), 1500);
                                }
                            }
                        }
                    }
                    lastMessageCountRef.current = newMessages.length;

                    setMessages(newMessages);
                    setCurrentQuestionIndex(newIdx);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }, [sessionId, code]);

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

    // Live code sync — debounced 3s, always uses the current active question
    useEffect(() => {
        if (!isAIActive) return;
        if (code === lastSyncedCodeRef.current) return;

        const currentQuestion = interviewData?.questions?.[currentQuestionIndex] || "General programming";
        const syncTimeout = setTimeout(() => {
            syncCodeContextWithAI(code, currentQuestion);
            lastSyncedCodeRef.current = code;
        }, 3000);

        return () => clearTimeout(syncTimeout);
    }, [code, isAIActive, interviewData, currentQuestionIndex]);

    useEffect(() => {
        const interval = setInterval(async () => {
            const timeSinceLastTyping = Date.now() - lastTypingTime;
            if (isAIActive && timeSinceLastTyping > 30000) {
                const currentQuestion = interviewData?.questions?.[currentQuestionIndex] || "General programming";
                const hint = await analyzeCode(code, currentQuestion);
                if (hint) {
                    syncCodeContextWithAI(code, currentQuestion);
                }
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [isAIActive, lastTypingTime, code, analyzeCode, interviewData, currentQuestionIndex]);

    const handleCodeChange = (newCode: string) => {
        setCode(newCode);
        setLastTypingTime(Date.now());
    };

    const handleAskAI = async () => {
        const currentQuestion = interviewData?.questions?.[currentQuestionIndex] || "General programming";
        if (!isAIActive) {
            startAITutor(code, currentQuestion);
        } else {
            const hint = await analyzeCode(code, currentQuestion);
            if (hint) {
                syncCodeContextWithAI(code, currentQuestion);
            }
        }
    };

    const handleEndInterview = async () => {
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

    // ── End Interview Confirmation Modal ─────────────────────────────────────
    const EndInterviewModal = showEndModal ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowEndModal(false)}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Red accent bar */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-600 via-red-400 to-red-600" />

                <div className="p-6">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 mx-auto mb-4">
                        <AlertTriangle className="h-7 w-7 text-red-400" />
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-white text-center">End Interview?</h2>
                    <p className="text-sm text-white/50 text-center mt-2 leading-relaxed">
                        Are you sure you want to end the interview early? Your current progress will be saved and you&apos;ll be taken to your feedback report.
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => setShowEndModal(false)}
                            className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all"
                        >
                            Keep Going
                        </button>
                        <button
                            onClick={() => { setShowEndModal(false); handleEndInterview(); }}
                            className="flex-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-semibold transition-all"
                        >
                            End Interview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    if (loading) {
       return <div className="flex bg-black h-screen items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    const InnerContent = (
        <div className="flex h-screen w-full bg-black flex-col md:flex-row overflow-hidden">
            {EndInterviewModal}
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
                            onClick={() => setShowEndModal(true)}
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
