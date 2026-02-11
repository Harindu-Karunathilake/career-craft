"use client";

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import VoiceInterviewSession from "@/components/interview/voice-interview-session"
import CodingInterviewSession from "@/components/interview/coding-interview-session"

export default function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [interviewData, setInterviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInterview = async () => {
            const userId = firebaseAuth.currentUser?.uid;
            
            // Wait for auth to initialize if not ready (handled by listener below, but this check is good for hot reload)
            if (!userId) return; 

            try {
                const docRef = doc(firebaseDb, "users", userId, "interviews", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setInterviewData(docSnap.data());
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

        const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                fetchInterview();
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black text-white">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!interviewData) return null;

    // Render based on Interview Mode
    if (interviewData.interviewMode === 'coding') {
        return <CodingInterviewSession sessionId={id} interviewData={interviewData} />;
    }

    // Default to Voice Interview
    return <VoiceInterviewSession sessionId={id} interviewData={interviewData} />;
}
