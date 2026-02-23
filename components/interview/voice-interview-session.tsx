"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bot, PhoneOff, Mic, MicOff } from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Vapi from "@vapi-ai/web"
import { interviewer } from "@/constants/interview"
import { generateFeedbackAction } from "@/lib/actions/feedback"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useDashboardPath } from "@/hooks/use-dashboard-path"
import toast from "react-hot-toast"

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface VoiceInterviewSessionProps {
    sessionId: string;
    interviewData: any;
}

let vapiSingleton: any = null;
let globalHasStarted = false;

// We will store the current React state setters here so the singleton can call them
// even if the component remounts in Strict Mode.
let setCallStatusGlobal: ((status: CallStatus) => void) | null = null;
let setMessagesGlobal: ((updater: any) => void) | null = null;
let setIsSpeakingGlobal: ((isSpeaking: boolean) => void) | null = null;
let setLastMessageGlobal: ((msg: string) => void) | null = null;

const getVapi = () => {
    if (!vapiSingleton) {
        const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
        if (!token) return null;
        vapiSingleton = new Vapi(token);

        // Bind listeners globally ONCE
        vapiSingleton.on("call-start", () => {
            console.log("GLOBAL VAPI: call-start received!");
            if (setCallStatusGlobal) setCallStatusGlobal(CallStatus.ACTIVE);
        });
        vapiSingleton.on("call-end", () => {
            console.log("GLOBAL VAPI: call-end received!");
            if (setCallStatusGlobal) setCallStatusGlobal(CallStatus.FINISHED);
            globalHasStarted = false; // Reset for next time
        });
        vapiSingleton.on("message", (message: any) => {
            console.log("GLOBAL VAPI: message received:", message.type, message.role);
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                if (setMessagesGlobal) setMessagesGlobal((prev: any) => [...prev, newMessage]);
                if (setLastMessageGlobal) setLastMessageGlobal(message.transcript);
            }
        });
        vapiSingleton.on("speech-start", () => {
            console.log("GLOBAL VAPI: speech-start received!");
            if (setIsSpeakingGlobal) setIsSpeakingGlobal(true);
        });
        vapiSingleton.on("speech-end", () => {
            console.log("GLOBAL VAPI: speech-end received!");
            if (setIsSpeakingGlobal) setIsSpeakingGlobal(false);
        });
        vapiSingleton.on("error", (error: any) => {
            console.error("GLOBAL VAPI: error received RAW:", error);
            if (setCallStatusGlobal) setCallStatusGlobal(CallStatus.INACTIVE);
            globalHasStarted = false; // Reset on error
        });
    }
    return vapiSingleton;
};

export default function VoiceInterviewSession({ sessionId, interviewData }: VoiceInterviewSessionProps) {
    const router = useRouter();
    const { interviews: interviewsDashboardPath } = useDashboardPath();
    
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [isMuted, setIsMuted] = useState(false);
    const vapiRef = useRef<any>(null);

    // Update the global setters every time this component renders
    // so the global Vapi instance always calls the *latest* React state setters.
    useEffect(() => {
        setCallStatusGlobal = setCallStatus;
        setMessagesGlobal = setMessages;
        setIsSpeakingGlobal = setIsSpeaking;
        setLastMessageGlobal = setLastMessage;

        return () => {
            setCallStatusGlobal = null;
            setMessagesGlobal = null;
            setIsSpeakingGlobal = null;
            setLastMessageGlobal = null;
        };
    }, []);

    // Use useCallback to prevent infinite loop in dependencies or move inside useEffect
    // Since startCall depends on interviewData which is a prop, we can define it inside or outside with useCallback.
    const handleGenerateFeedback = useCallback(async () => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) return;

        if (messages.length === 0) {
            router.push(interviewsDashboardPath);
            return;
        }

        try {
            toast.success("Call ended. Transitioning to feedback...");
            const result = await generateFeedbackAction({ transcript: messages });
            
            if (result.success && result.feedback) {
                await updateDoc(doc(firebaseDb, "users", userId, "interviews", sessionId), {
                    feedback: result.feedback,
                    status: "completed",
                    completedAt: serverTimestamp(),
                    transcript: messages
                });
                
                router.push(`/interview/${sessionId}/feedback`);
            } else {
               alert("Failed to generate feedback.");
            }

        } catch (error) {
            console.error("Error saving feedback:", error);
            alert("Error saving interview results.");
        }
    }, [messages, sessionId, interviewsDashboardPath, router]);

    useEffect(() => {
        const vapiInstance = getVapi();
        if (!vapiInstance) {
            console.error("Vapi: Failed to get singleton instance.");
            return;
        }
        
        vapiRef.current = vapiInstance;

        // Start call logic scoped to this instance
        const startDynamicCall = async () => {
             // Use the global flag to prevent Strict Mode double-firing
             if (globalHasStarted) {
                 console.log("Vapi: globalHasStarted is true, skipping start.");
                 return;
             }
             globalHasStarted = true;
             
             setCallStatus(CallStatus.CONNECTING);
             try {
                 const questionsList = (interviewData.questions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
                 let contextString = "";
                 let personalizedGreeting = interviewer.firstMessage;
                 const hasResume = interviewData.resumeContext?.fullText && interviewData.resumeContext.fullText.length > 50;
                 const candidateName = interviewData.resumeContext?.candidateName || "Candidate";

                 if (hasResume) {
                     contextString = `Candidate Name: ${candidateName}\nCandidate Summary: ${interviewData.resumeContext.summary}\nRESUME CONTENT:\n${interviewData.resumeContext.fullText}\nINSTRUCTIONS:\n- Use the RESUME CONTENT to ask follow-up questions.\n- Address the candidate by name.\n- Dig deep into their projects.`;
                     personalizedGreeting = `Hello ${candidateName}! Thank you for taking the time to speak with me today. I've reviewed your resume and I'm excited to discuss your experience with ${interviewData.resumeContext.summary ? "your projects" : "us"}.`;
                 } else if (candidateName !== "Candidate") {
                      personalizedGreeting = `Hello ${candidateName}! Thank you for joining me for this ${interviewData.role} interview.`;
                 }

                 const modifiedInterviewer = {
                     ...interviewer,
                     firstMessage: personalizedGreeting,
                     model: {
                         ...interviewer.model,
                         messages: [
                             {
                                 ...interviewer.model.messages[0],
                                 content: interviewer.model.messages[0].content
                                     .replace('{{questions}}', questionsList || "Ask general questions.")
                                     .replace('{{resumeContext}}', contextString)
                             }
                         ]
                     }
                 };

                 console.log("Vapi: About to call vapiInstance.start()...");
                 const startResult = await vapiInstance.start(modifiedInterviewer);
                 console.log("Vapi: vapiInstance.start() Promise resolved with:", startResult); 
             } catch (err: any) {
                 console.error("Vapi: Failed to start instance call (Caught exception):", err);
                 setCallStatus(CallStatus.INACTIVE);
                 globalHasStarted = false;
             }
        };

        startDynamicCall();

        // No cleanup needed for listeners because they are global!
        return () => {
            console.log("Vapi: useEffect unmounting, keeping global listeners intact.");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run on mount



    const endCall = async () => {
        if (vapiRef.current) {
            vapiRef.current.stop();
        }
        setCallStatus(CallStatus.FINISHED);
        await handleGenerateFeedback();
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        if (vapiRef.current) {
            vapiRef.current.setMuted(newMutedState);
        }
        setIsMuted(newMutedState);
    }

    return (
        <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans">
             {/* Background Effects */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]" aria-hidden="true" />

            <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-8 px-6">
                
                {/* Status Header */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className={cn("h-2.5 w-2.5 rounded-full", callStatus === CallStatus.ACTIVE ? "bg-emerald-500 animate-pulse" : "bg-gray-500")} />
                    <span className="text-sm font-medium text-white">
                        {callStatus === CallStatus.CONNECTING ? "Connecting..." : 
                         callStatus === CallStatus.ACTIVE ? "Live Interview" : "Session Ended"}
                    </span>
                    <span className="text-white/20">|</span>
                    <span className="text-sm text-white/60">{interviewData?.role} • {interviewData?.experience}</span>
                </div>

                {/* Main Visualizer Area */}
                <div className="relative grid w-full gap-8 md:grid-cols-2 max-w-4xl mt-8">
                     {/* AI Avatar */}
                     <div className={cn("relative flex flex-col items-center justify-center aspect-square rounded-full border-4 transition-all duration-300", isSpeaking ? "border-emerald-500/50 scale-105 shadow-[0_0_50px_rgba(16,185,129,0.3)]" : "border-white/10")}>
                        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-3xl" />
                        <Bot className="h-24 w-24 text-emerald-400 relative z-10" />
                        {isSpeaking && (
                             <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
                        )}
                     </div>

                     {/* User Transcript / Avatar */}
                     <div className="flex flex-col items-center justify-center gap-6">
                         <div className="relative h-32 w-32">
                            <Avatar className="h-full w-full ring-4 ring-white/10 shadow-2xl">
                                <AvatarImage src={firebaseAuth.currentUser?.photoURL || ""} />
                                <AvatarFallback className="text-2xl">ME</AvatarFallback>
                            </Avatar>
                         </div>
                         
                         {/* Controls */}
                         <div className="flex items-center gap-4">
                             <Button 
                                variant="outline" 
                                size="icon" 
                                className={cn("h-14 w-14 rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors", isMuted && "bg-red-500/20 text-red-500 border-red-500/50")}
                                onClick={toggleMute}
                             >
                                 {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                             </Button>
                             <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                                onClick={endCall}
                             >
                                 <PhoneOff className="h-6 w-6" />
                             </Button>
                         </div>
                     </div>
                </div>

                {/* Transcript */}
                <Card className="w-full max-w-2xl h-32 flex items-center justify-center p-6 bg-white/5 border-white/10 backdrop-blur-md mt-8">
                    <p className="text-center text-lg font-medium text-white/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {lastMessage || "Connecting to AI Interviewer..."}
                    </p>
                </Card>

            </div>
        </main>
    );
}
