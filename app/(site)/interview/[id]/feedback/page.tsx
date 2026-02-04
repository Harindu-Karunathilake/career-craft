"use client";

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, CheckCircle, AlertTriangle, BarChart3 } from "lucide-react"

import { motion } from "framer-motion"

export default function InterviewFeedbackPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [feedback, setFeedback] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dashboardLink, setDashboardLink] = useState('/user/interviews');

    useEffect(() => {
        const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                     const userDoc = await getDoc(doc(firebaseDb, "users", user.uid));
                     const userData = userDoc.data();
                     // Default is already /user/interviews, only change if tutor
                     if (userData?.role === 'tutor') {
                         setDashboardLink('/tutor');
                     }
                } catch (e) {
                    console.error("Error fetching user role for navigation", e);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchFeedback = async () => {
             // Retrieve userId from query params (if viewing another user's interview)
             // or fallback to current user (if viewing own)
            const paramUserId = searchParams.get('uid');
            const currentUser = firebaseAuth.currentUser;
            const userId = paramUserId || currentUser?.uid;

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

        // If we have a uid param, we don't strictly need to wait for auth state 
        // (unless we want to enforce login to view public interviews, but typically public is public)
        if (searchParams.get('uid')) {
            fetchFeedback();
        } else {
             // Wait for auth if no uid param
            const unsub = firebaseAuth.onAuthStateChanged((user) => {
                if (user) fetchFeedback();
                else setLoading(false);
            });
            return () => unsub();
        }
    }, [id, searchParams]);

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-zinc-400">Generatng report...</p>
            </div>
        </div>
    );
    if (!feedback) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Feedback not found.</div>;

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <main className="min-h-screen bg-black text-white p-8 md:p-12 font-sans relative overflow-hidden">
             {/* Background Effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent_50%)]" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto space-y-10 relative z-10"
            >
                
                <motion.div variants={itemVariants} className="space-y-4 text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Interview Analysis</h1>
                    <p className="text-lg text-white/60">Detailed AI feedback on your performance.</p>
                </motion.div>

                {/* Score Overview */}
                <div className="grid gap-6 md:grid-cols-2">
                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-white/5 border-white/10 p-8 flex flex-col items-center justify-center space-y-4 backdrop-blur-md">
                            <div className="text-sm uppercase tracking-wider text-white/50">Overall Score</div>
                            <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-500/20 drop-shadow-lg">{feedback.totalScore}</div>
                            <div className="text-sm text-white/50">out of 100</div>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-white/5 border-white/10 p-8 space-y-6 backdrop-blur-md">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-indigo-300">
                                <BarChart3 className="h-5 w-5" />
                                Category Breakdown
                            </h3>
                            <div className="space-y-4">
                                {feedback.categoryScores.map((cat: any) => (
                                    <div key={cat.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-300">{cat.name}</span>
                                            <span className="font-medium text-emerald-400">{cat.score}/100</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${cat.score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" 
                                            />
                                        </div>
                                        <p className="text-xs text-zinc-500">{cat.comment}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                     {/* Strengths */}
                    <motion.div variants={itemVariants}>
                        <Card className="h-full bg-white/5 border-white/10 p-6 space-y-4 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Core Strengths
                            </h3>
                            <ul className="space-y-3">
                                {feedback.strengths.map((str: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                        {str}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </motion.div>

                     {/* Weaknesses */}
                     <motion.div variants={itemVariants}>
                        <Card className="h-full bg-white/5 border-white/10 p-6 space-y-4 backdrop-blur-md hover:bg-white/10 transition-colors">
                            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Areas for Improvement
                            </h3>
                            <ul className="space-y-3">
                                {feedback.areasForImprovement.map((area: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm text-zinc-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                        {area}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </motion.div>
                </div>
                
                <motion.div variants={itemVariants}>
                    <Card className="bg-indigo-900/10 border-indigo-500/20 p-8 text-center space-y-4 backdrop-blur-md">
                        <h3 className="text-xl font-semibold text-indigo-300">Final Assessment</h3>
                        <p className="text-zinc-300 leading-relaxed max-w-2xl mx-auto">
                            {feedback.finalAssessment}
                        </p>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="flex justify-center gap-4 pt-4">
                    <Button variant="outline" className="border-white/10 bg-transparent hover:bg-white/10 text-white" onClick={() => router.push(dashboardLink)}>
                        View History
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-500 text-white transition-all hover:scale-105 shadow-lg shadow-emerald-900/20" onClick={() => router.push('/interview/setup')}>
                        Start New Interview <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </motion.div>

            </motion.div>
        </main>
    )
}
