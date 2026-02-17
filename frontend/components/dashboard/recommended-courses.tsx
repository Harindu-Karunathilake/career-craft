"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface RecommendedCourse {
    id: string;
    title: string;
    description: string;
    price: number;
    coverImage?: string;
    createdAt: any;
    reason: string;
    matchScore: number;
}

export function RecommendedCourses() {
    const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [hasResume, setHasResume] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkResume = async () => {
            const user = firebaseAuth.currentUser;
            if (!user) return;
            try {
                const resumesRef = collection(firebaseDb, "users", user.uid, "resumes");
                const q = query(resumesRef, orderBy("createdAt", "desc"), limit(1));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setHasResume(true);
                }
            } catch (err) {
                console.error("Error checking resume:", err);
            }
        };
        checkResume();
    }, []);

    const generateRecommendations = async () => {
        const user = firebaseAuth.currentUser;
        if (!user) return;

        setLoading(true);
        setAnalyzing(true);
        setError(null);

        try {
            // 1. Fetch Latest Resume Metadata
            const resumesRef = collection(firebaseDb, "users", user.uid, "resumes");
            const resumeQ = query(resumesRef, orderBy("createdAt", "desc"), limit(1));
            const resumeSnapshot = await getDocs(resumeQ);

            if (resumeSnapshot.empty) {
                throw new Error("No resume found. Please upload a resume first.");
            }

            const resumeId = resumeSnapshot.docs[0].id; // We use ID to let server handle encrypted file

            // 2. Fetch Interview History
            const interviewsRef = collection(firebaseDb, "users", user.uid, "interviews");
            const interviewsQ = query(interviewsRef, orderBy("createdAt", "desc"), limit(5));
            const interviewsSnapshot = await getDocs(interviewsQ);
            
            const interviewHistory = interviewsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    role: data.role,
                    topic: data.topic,
                    averageScore: data.feedback?.totalScore || 0,
                    weaknesses: data.feedback?.weaknesses || []
                };
            });

            // 3. Call Recommendation API (Secure Server-Side Processing)
            const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recommendations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    resumeId: resumeId,
                    userId: user.uid,
                    interviewHistory 
                }),
            });

            if (!apiResponse.ok) {
                const errData = await apiResponse.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate recommendations.");
            }

            const { recommendations: apiRecs } = await apiResponse.json();

            // 4. Fetch Full Course Details
            const fullCourses: RecommendedCourse[] = [];
            
            for (const rec of apiRecs) {
                try {
                    const courseDoc = await getDoc(doc(firebaseDb, "courses", rec.courseId));
                    if (courseDoc.exists()) {
                        const courseData = courseDoc.data();
                        fullCourses.push({
                            id: courseDoc.id,
                            title: courseData.title,
                            description: courseData.description,
                            price: courseData.price || 0,
                            coverImage: courseData.coverImage,
                            createdAt: courseData.createdAt,
                            reason: rec.reason,
                            matchScore: rec.matchScore,
                        });
                    }
                } catch (e) {
                    console.error(`Failed to fetch details for course ${rec.courseId}`, e);
                }
            }

            setRecommendations(fullCourses);

        } catch (err: any) {
            console.error("Recommendation Error:", err);
            setError(err.message || "Something went wrong.");
            toast.error(err.message || "Failed to generate recommendations");
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    if (!hasResume && !loading && recommendations.length === 0) {
        return null; 
    }

    if (!hasResume) {
         return (
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-white/10">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-white/5 rounded-full">
                        <Sparkles className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Unlock AI Course Recommendations</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-1">
                            Upload your resume to get personalized learning paths based on your skills and interview performance.
                        </p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/user/resume">Upload Resume</Link>
                    </Button>
                </div>
            </div>
         )
    }

    return (
        <div className="space-y-6 py-8 mb-8">
             <div className="flex items-center justify-between">
                <div>
                     <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400" /> 
                        Recommended for You
                    </h3>
                    <p className="text-sm text-muted-foreground">AI-curated courses based on your resume and interview history.</p>
                </div>
                 {recommendations.length === 0 && !loading && !analyzing && (
                    <Button onClick={generateRecommendations} variant="outline" className="border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400 text-indigo-400">
                        <Sparkles className="mr-2 h-4 w-4" /> 
                        Analyze & Recommend
                    </Button>
                )}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
                    <p className="text-sm text-white font-medium">Analyzing your profile...</p>
                    <p className="text-xs text-muted-foreground">Reading resume and interview history</p>
                </div>
            )}

            {error && !loading && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-400">{error}</p>
                    <Button variant="ghost" size="sm" onClick={generateRecommendations} className="ml-auto text-red-400 hover:text-red-300 hover:bg-red-500/10">Retry</Button>
                </div>
            )}

            {!loading && recommendations.length > 0 && (
                 <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
                    {recommendations.map((course) => (
                        <Card key={course.id} className="bg-white/5 border-white/10 hover:border-indigo-500/30 transition-all flex flex-col overflow-hidden group">
                           {/* Cover Image */}
                            <div className="relative h-32 w-full bg-zinc-900 border-b border-white/5">
                                {course.coverImage ? (
                                    <Image 
                                        src={course.coverImage} 
                                        alt={course.title} 
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                        <BookOpen className="w-8 h-8 text-indigo-500/40" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                     <Badge className={`backdrop-blur border-white/10 text-white text-xs px-2 py-0.5 ${course.matchScore > 80 ? 'bg-green-500/60' : 'bg-indigo-500/60'}`}>
                                         {course.matchScore}% Match
                                     </Badge>
                                </div>
                            </div>
                            
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base text-white group-hover:text-indigo-400 transition-colors truncate">
                                    {course.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-xs mt-1">
                                    <span className="text-indigo-300 font-medium">Why: </span> {course.reason}
                                </CardDescription>
                            </CardHeader>
                            
                            <CardFooter className="p-4 pt-auto mt-auto">
                                <Button variant="secondary" size="sm" className="w-full h-8 text-xs" asChild>
                                    <Link href={`/courses/${course.id}`}>
                                       View Course
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            )}
        </div>
    );
}
