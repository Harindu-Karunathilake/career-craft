"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, FileText, RefreshCw, Plus, Calendar } from "lucide-react";
import Link from "next/link";

interface Interview {
    id: string;
    role: string;
    experience: string;
    topic: string;
    status: "pending" | "completed";
    createdAt: any;
    feedback?: any;
    questions?: string[];
}

export default function DashboardPage() {
    const router = useRouter();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInterviews = async (userId: string) => {
            try {
                const q = query(
                    collection(firebaseDb, "users", userId, "interviews"),
                    orderBy("createdAt", "desc")
                );
                
                const querySnapshot = await getDocs(q);
                const fetchedInterviews: Interview[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedInterviews.push({ id: doc.id, ...doc.data() } as Interview);
                });
                
                setInterviews(fetchedInterviews);
            } catch (error) {
                console.error("Error fetching interviews:", error);
                // Fallback for index errors (if compound index missing)
                // Try simpler query without sort if this fails, or just warn user
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                fetchInterviews(user.uid);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white p-8 pt-24">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Dashboard</h1>
                        <p className="text-muted-foreground mt-1">Manage your mock interviews and view feedback.</p>
                    </div>
                    <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                        <Link href="/interview/setup">
                            <Plus className="mr-2 h-4 w-4" />
                            New Interview
                        </Link>
                    </Button>
                </div>

                {interviews.length === 0 ? (
                    <Card className="bg-white/5 border-white/10 p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-white/50" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">No interviews yet</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Start your first AI-powered mock interview to practice and get feedback.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/interview/setup">Start Interview</Link>
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {interviews.map((interview) => (
                            <Card key={interview.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <Badge variant={interview.status === 'completed' ? 'default' : 'outline'} className={interview.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "text-yellow-500 border-yellow-500/20"}>
                                            {interview.status === 'completed' ? 'Completed' : 'Pending'}
                                        </Badge>
                                        {interview.createdAt?.seconds && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(interview.createdAt.seconds * 1000).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <CardTitle className="text-white mt-2 truncate">{interview.role}</CardTitle>
                                    <CardDescription className="text-zinc-400">
                                        {interview.experience} • {interview.topic}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {interview.questions ? `${interview.questions.length} Questions generated.` : 'Questions ready.'}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-white/5 gap-2">
                                    {interview.status === 'completed' ? (
                                        <>
                                            <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/10 hover:text-white" asChild>
                                                <Link href={`/interview/${interview.id}/feedback`}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Feedback
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="hover:text-white" asChild>
                                                 <Link href="/interview/setup">
                                                    <RefreshCw className="h-4 w-4" />
                                                    <span className="sr-only">Retake</span>
                                                </Link>
                                            </Button>
                                        </>
                                    ) : (
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                                            <Link href={`/interview/${interview.id}`}>
                                                <Play className="mr-2 h-4 w-4" />
                                                Start Now
                                            </Link>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
