 "use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bot, PhoneOff, Mic, MicOff } from "lucide-react"
import { useEffect, useState, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Vapi from "@vapi-ai/web"
import { interviewer } from "@/constants/interview"
import { generateFeedbackAction } from "@/lib/actions/feedback"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { collection, doc, setDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

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

function InterviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const role = searchParams.get("role") || "Software Engineer";
    const experience = searchParams.get("experience") || "Junior";
    const topic = searchParams.get("topic") || "General";
    const questionCount = searchParams.get("questionCount") || "5";
    
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

    const endCall = async () => {
        if (vapiRef.current) {
            vapiRef.current.stop();
        }
        setCallStatus(CallStatus.FINISHED);
        await handleGenerateFeedback();
    };    

    useEffect(() => {
        const vapiInstance = getVapi();
        if (!vapiInstance) {
            console.error("Vapi: Failed to initialize Vapi instance");
            return;
        }

        vapiRef.current = vapiInstance;
        
        const startDynamicCall = async () => {
             // Use the global flag to prevent Strict Mode double-firing
             if (globalHasStarted) {
                 console.log("Vapi: globalHasStarted is true, skipping start.");
                 return;
             }
             globalHasStarted = true;
             
             setCallStatus(CallStatus.CONNECTING);
             try {
                 console.log("Vapi: About to call vapiInstance.start()...");
                 const startResult = await vapiInstance.start(interviewer);
                 console.log("Vapi: vapiInstance.start() Promise resolved with:", startResult);
             } catch (err: any) {
                 console.error("Vapi: Failed to start instance call (Caught exception):", err);
                 setCallStatus(CallStatus.INACTIVE);
                 globalHasStarted = false;
             }
        };

        startDynamicCall();

        return () => {
            console.log("Vapi: useEffect unmounting, keeping global listeners intact.");
        };
    }, []);

    const toggleMute = () => {
        const newMutedState = !isMuted;
        if (vapiRef.current) {
            vapiRef.current.setMuted(newMutedState);
        }
        setIsMuted(newMutedState);
    }

    const handleGenerateFeedback = async () => {
        if (messages.length === 0) {
            console.log("No messages to analyze");
            router.push("/interview/setup");
            return;
        }

        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) {
            alert("Please log in to save your interview results.");
            return;
        }

        try {
            // Generate Feedback via Server Action
            const result = await generateFeedbackAction({ transcript: messages });
            
            if (result.success && result.feedback) {
                // Save to Firebase Client Side
                const interviewId = doc(collection(firebaseDb, "users", userId, "interviews")).id;
                await setDoc(doc(firebaseDb, "users", userId, "interviews", interviewId), {
                    id: interviewId,
                    role: role,
                    experience: experience,
                    topic: topic,
                    questionCount: parseInt(questionCount),
                    feedback: result.feedback,
                    type: "Simulated",
                    createdAt: new Date().toISOString(),
                    transcript: messages
                });
                
                
                router.push(`/interview/${interviewId}/feedback`);
            } else {
               alert("Failed to generate feedback. Please try again.");
            }

        } catch (error) {
            console.error("Error finalizing interview:", error);
            alert("Something went wrong saving your interview.");
        }
    };

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
                    <span className="text-white/20">|</span>
                    <span className="text-sm text-white/60">{role} • {experience} • {topic}</span>
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
                        {lastMessage || "Listening..."}
                    </p>
                </Card>

            </div>
        </main>
    );
}

export default function ActiveInterviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-white">Loading interview...</div>}>
      <InterviewContent />
    </Suspense>
  )
}
