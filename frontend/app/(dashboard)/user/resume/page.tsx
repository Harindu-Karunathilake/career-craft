"use client";

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Calendar, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
export default function UserResumePage() {
    const [resumes, setResumes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResumes = async () => {
            const userId = firebaseAuth.currentUser?.uid;
            if (userId) {
                const q = query(
                    collection(firebaseDb, "users", userId, "resumes"),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setResumes(data);
            }
            setLoading(false);
        };
        
        // Listen for auth state to ensure we have user
        const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                fetchResumes();
            } else {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (e: React.MouseEvent, resumeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if(!confirm("Are you sure you want to delete this analysis?")) return;
        
        const userId = firebaseAuth.currentUser?.uid;
        if(!userId) return;

        try {
            await deleteDoc(doc(firebaseDb, "users", userId, "resumes", resumeId));
            setResumes(resumes.filter(r => r.id !== resumeId));
        } catch (error) {
            console.error("Error deleting resume:", error);
        }
    }

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Resumes</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage and review your AI-analyzed resumes.
                    </p>
                </div>
                <Link href="/resume/analyze">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Analysis
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-white">Loading...</div>
            ) : resumes.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 bg-white/5 border-dashed border-white/20">
                    <div className="h-16 w-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">No resumes analyzed yet</h3>
                    <p className="text-muted-foreground mb-6 text-center max-w-sm">
                        Upload your resume to get instant AI feedback on ATS compatibility, content, and structure.
                    </p>
                    <Link href="/resume/analyze">
                        <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                            Start First Analysis
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {resumes.map((resume) => (
                        <Link href={`/resume/${resume.id}`} key={resume.id}>
                            <Card className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {resume.analysis?.overallScore || 0}
                                        <span className="text-sm text-muted-foreground font-normal ml-1">/100</span>
                                    </div>
                                </div>
                                
                                <h3 className="font-semibold text-lg text-white mb-1 truncate">{resume.jobTitle}</h3>
                                <p className="text-sm text-muted-foreground mb-4 truncate">{resume.companyName}</p>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(resume.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-400" onClick={(e) => handleDelete(e, resume.id)}>
                                            <Trash2 className="h-3 w-3" />
                                         </Button>
                                         <ArrowRight className="h-4 w-4 bg-transparent group-hover:translate-x-1 transition-transform text-primary" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
