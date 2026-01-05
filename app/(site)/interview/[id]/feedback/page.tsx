"use client";

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, CheckCircle, AlertTriangle, BarChart3, Calendar } from "lucide-react"

export default function InterviewFeedbackPage() {
    const { id } = useParams();
    const router = useRouter();
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            const userId = firebaseAuth.currentUser?.uid;
            if (!userId || !id) return;

            try {
                const docRef = doc(firebaseDb, "users", userId, "interviews", id as string);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    setFeedback(docSnap.data().feedback);
                } else {
                    console.error("No feedback found");
                }
            } catch (err) {
                console.error("Error fetching feedback", err);
            } finally {
                setLoading(false);
            }
        };

        // Wait for auth
        const unsub = firebaseAuth.onAuthStateChanged((user) => {
            if (user) fetchFeedback();
            else setLoading(false);
        });
        return () => unsub();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading feedback...</div>;
    if (!feedback) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Feedback not found.</div>;

    return (
        <main className="min-h-screen bg-black text-white p-8 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-10">
                
                <div className="space-y-4 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Interview Analysis</h1>
                    <p className="text-muted-foreground">Detailed AI feedback on your performance.</p>
                </div>

                {/* Score Overview */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-white/5 border-white/10 p-8 flex flex-col items-center justify-center space-y-4">
                        <div className="text-sm uppercase tracking-wider text-muted-foreground">Overall Score</div>
                        <div className="text-6xl font-bold text-emerald-400">{feedback.totalScore}</div>
                        <div className="text-sm text-white/50">out of 100</div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 p-8 space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-400" />
                            Category Breakdown
                        </h3>
                        <div className="space-y-4">
                            {feedback.categoryScores.map((cat: any) => (
                                <div key={cat.name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{cat.name}</span>
                                        <span className="font-medium text-emerald-400">{cat.score}/100</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cat.score}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">{cat.comment}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                     {/* Strengths */}
                    <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Core Strengths
                        </h3>
                        <ul className="space-y-3">
                            {feedback.strengths.map((str: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-white/80">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                    {str}
                                </li>
                            ))}
                        </ul>
                    </Card>

                     {/* Weaknesses */}
                     <Card className="bg-white/5 border-white/10 p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Areas for Improvement
                        </h3>
                        <ul className="space-y-3">
                            {feedback.areasForImprovement.map((area: string, i: number) => (
                                <li key={i} className="flex gap-3 text-sm text-white/80">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                    {area}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
                
                <Card className="bg-indigo-500/10 border-indigo-500/20 p-8 text-center space-y-4">
                    <h3 className="text-xl font-semibold">Final Assessment</h3>
                    <p className="text-indigo-200/80 leading-relaxed max-w-2xl mx-auto">
                        {feedback.finalAssessment}
                    </p>
                </Card>

                <div className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" className="border-white/10 hover:bg-white/10 text-white" onClick={() => router.push('/user/interviews')}>
                        View History
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => router.push('/interview/setup')}>
                        Start New Interview <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

            </div>
        </main>
    )
}
