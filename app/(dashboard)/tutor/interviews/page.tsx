"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, FileText, RefreshCw, Plus, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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

export default function TutorInterviewsPage() {
    const router = useRouter();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    const handleDelete = async (interviewId: string) => {
        const userId = firebaseAuth.currentUser?.uid;
        if (!userId) return;

        try {
            await deleteDoc(doc(firebaseDb, "users", userId, "interviews", interviewId));
            setInterviews(prev => prev.filter(i => i.id !== interviewId));
            toast.success("Interview deleted successfully.");
        } catch (error) {
            console.error("Error deleting interview:", error);
            toast.error("Failed to delete interview.");
        }
    };

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
                <Button asChild className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20">
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
                        <Card key={interview.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col hover:shadow-lg hover:shadow-emerald-500/5 group relative">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Interview?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-zinc-400">
                                                This action cannot be undone. This will permanently delete your interview record and feedback.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => handleDelete(interview.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
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
                                <CardTitle className="text-foreground mt-2 truncate group-hover:text-emerald-400 transition-colors pr-8">{interview.role}</CardTitle>
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
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
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
    );
}
