"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bot, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { vapi } from "@/lib/vapi.sdk"
import { interviewer } from "@/constants/interview"
import { generateFeedbackAction } from "@/lib/actions/feedback"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
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

export default function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use() as recommended for Next.js 15+ (or await if async component, but this is client)
    // Actually in client components params produces a promise in newer Next.js versions but let's stick to standard if possible.
    // Assuming standard Next.js 14/15 client component usage, params is a prop.
    // But 'params' in client components might need 'use' hook in Next 15. The user's package.json says Next 16.0.3 (Wait, 16?? Next.js 16 isn't out, probably 15 or 14, user said 16.0.3 but that might be 15 rc or mistake, I'll assume standard await params pattern or just props).
    // Actually package.json said "next": "16.0.3" -- checking again -- yes it says 16.0.3. This is likely a very new or canary version, or I misread. Next 15 is current stable. 16 might be canary.
    // In Next 15, params is generic promise.
    const { id } = use(params);

    const router = useRouter();
    
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [isMuted, setIsMuted] = useState(false);
    const [interviewData, setInterviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInterview = async () => {
            const userId = firebaseAuth.currentUser?.uid;
            if (!userId) return; // Auth check handled elsewhere or via protection

            try {
                const docRef = doc(firebaseDb, "users", userId, "interviews", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setInterviewData(docSnap.data());
                    startCall(docSnap.data());
                } else {
                    console.error("Interview not found");
                    router.push('/interview/setup');
                }
            } catch (error) {
                console.error("Error fetching interview:", error);
            } finally {
                setLoading(false);
            }
        };

        // Listen for auth ready
        const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                fetchInterview();
            } else {
                router.push('/login'); // Redirect if not logged in
            }
        });

        return () => unsubscribe();
    }, [id, router]);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
        
        const onMessage = (message: any) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prev) => [...prev, newMessage]);
                setLastMessage(message.transcript);
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: any) => {
            console.error("Vapi Error RAW:", error);
            try {
                console.error("Vapi Error JSON:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            } catch (e) {
                console.error("Could not stringify error");
            }
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.stop(); 
            vapi.removeAllListeners();
        };
    }, []);

    const startCall = async (data: any) => {
        const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
        if (!token) {
            console.error("Missing Vapi Web Token");
            alert("Configuration Error: Missing Vapi Web Token.");
            return;
        }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            console.error("Microphone access denied:", e);
            alert("Please allow microphone access to continue.");
            return;
        }

        setCallStatus(CallStatus.CONNECTING);
        try {
            vapi.stop(); // Ensure any previous session is ended
            // Prepare dynamic interviewer object
            const questionsList = (data.questions || []).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
            
            // Prepare context string
            // Prepare context string
            let contextString = "";
            let personalizedGreeting = interviewer.firstMessage;

            // Check if we actually have resume content
            const hasResume = data.resumeContext?.fullText && data.resumeContext.fullText.length > 50;
            const candidateName = data.resumeContext?.candidateName || "Candidate";

            console.log("Greeting Debug:", { 
                hasResume, 
                fullTextLength: data.resumeContext?.fullText?.length,
                candidateName,
                rawContext: data.resumeContext 
            });

            if (hasResume) {
                contextString = `
                Candidate Name: ${candidateName}
                Candidate Summary: ${data.resumeContext.summary}
                
                RESUME CONTENT:
                ${data.resumeContext.fullText}
                
                INSTRUCTIONS:
                - Use the "RESUME CONTENT" above to ask specific, relevant follow-up questions.
                - Address the candidate by name occasionally.
                - Dig deep into their specific projects and experience mentioned in the resume text.
                `;
                
                // Personalize the greeting for resume users
                personalizedGreeting = `Hello ${candidateName}! Thank you for taking the time to speak with me today. I've reviewed your resume and I'm excited to discuss your experience with ${data.resumeContext.summary ? "your projects" : "us"}.`;
            } else if (candidateName !== "Candidate") {
                 // Personalize greeting if we somehow have a name but no resume (unlikely but safe)
                 personalizedGreeting = `Hello ${candidateName}! Thank you for joining me for this ${data.role} interview.`;
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

            await vapi.start(modifiedInterviewer);
        } catch (err: any) {
            console.error("Failed to start call", err);
            // alert(`Failed to start interview: ${err.message}`); // Only alert if not handled by onError
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const endCall = async () => {
        vapi.stop();
        setCallStatus(CallStatus.FINISHED);
        await handleGenerateFeedback();
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        vapi.setMuted(newMutedState);
        setIsMuted(newMutedState);
    }

    const handleGenerateFeedback = async () => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) return;

        if (messages.length === 0) {
            router.push('/user/interviews');
            return;
        }

        try {
            const result = await generateFeedbackAction({ transcript: messages });
            
            if (result.success && result.feedback) {
                // Update existing document
                await updateDoc(doc(firebaseDb, "users", userId, "interviews", id), {
                    feedback: result.feedback,
                    status: "completed",
                    completedAt: serverTimestamp(),
                    transcript: messages
                });
                
                router.push(`/interview/${id}/feedback`); // Assuming feedback page exists or dashboard
            } else {
               alert("Failed to generate feedback.");
            }

        } catch (error) {
            console.error("Error saving feedback:", error);
            alert("Error saving interview results.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
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
