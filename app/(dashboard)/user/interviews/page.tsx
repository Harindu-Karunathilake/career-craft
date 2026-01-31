"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
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

export default function UserInterviewsPage() {
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
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                fetchInterviews(user.uid);
            } else {
                // In a dashboard layout, maybe we don't redirect aggressively if the layout handles auth, 
                // but good to keep.
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            <div className="flex items-center justify-between">
                <div>
                     <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">My Interviews</p>
                    <h1 className="text-3xl font-bold tracking-tight">Interview History</h1>
                    <p className="text-muted-foreground mt-1">Manage your mock interviews and view feedback.</p>
                </div>
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20">
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
                        <h3 className="text-xl font-semibold text-foreground">No interviews yet</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Start your first AI-powered mock interview to practice and get feedback.
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/interview/setup">Start Interview</Link>
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {interviews.map((interview) => (
                        <Card key={interview.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col hover:shadow-lg hover:shadow-emerald-500/5 group">
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
                                <CardTitle className="text-foreground mt-2 truncate group-hover:text-indigo-400 transition-colors">{interview.role}</CardTitle>
                                <CardDescription className="text-muted-foreground">
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
                    
                     {/* Add New Mock Card (Optional addition to match previous design) */}
                     <Link href="/interview/setup" className="flex">
                        <button className="group relative flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-white/10 bg-white/5 transition-all hover:border-indigo-500/50 hover:bg-white/10 min-h-[250px]">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 transition-transform duration-300 group-hover:scale-110 group-hover:bg-indigo-500/20">
                            <span className="text-2xl font-light text-indigo-500">+</span>
                            </div>
                            <p className="font-medium text-muted-foreground group-hover:text-white">Start New Interview</p>
                        </button>
                    </Link>
                </div>
            )}
        </div>
    );
}
