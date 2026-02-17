"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import { Card, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, Sparkles, AlertCircle, Building2, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface RecommendedJob {
    id: number | string;
    role: string;
    company_name: string;
    location: string;
    remote: boolean;
    url: string;
    date_posted: string;
    matchScore: number;
    reason: string;
}

export function RecommendedJobs() {
    const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [hasResume, setHasResume] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

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
            const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job-recommendations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.uid }),
            });

            if (!apiResponse.ok) {
                const errData = await apiResponse.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate job recommendations.");
            }

            const { recommendations: apiRecs } = await apiResponse.json();
            setRecommendations(apiRecs);

        } catch (err: any) {
            console.error("Job Recommendation Error:", err);
            setError(err.message || "Something went wrong.");
            toast.error(err.message || "Failed to generate job recommendations");
        } finally {
            setLoading(false);
            setAnalyzing(false);
            setHasSearched(true);
        }
    };

    if (!hasResume && !loading && recommendations.length === 0) {
        return (
             <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10 mb-8">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-white/5 rounded-full">
                        <Sparkles className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Unlock AI Job Recommendations</h3>
                            <p className="text-sm text-center text-muted-foreground">
                                You&apos;re all caught up! No more job recommendations available at the moment.
                            </p>
                    </div>
                    <Button asChild variant="secondary" size="sm">
                        <Link href="/user/resume">Upload Resume</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-10">
             <div className="flex items-center justify-between">
                <div>
                     <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-400" /> 
                        Recommended Jobs
                    </h3>
                    <p className="text-sm text-muted-foreground">AI-curated top picks based on your resume.</p>
                </div>
                 {(recommendations.length === 0 && !loading && !analyzing && hasResume) && (
                    <Button onClick={generateRecommendations} variant="outline" className="border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 text-blue-400">
                        <Sparkles className="mr-2 h-4 w-4" /> 
                        Find My Matches
                    </Button>
                )}
            </div>

            {loading && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                    <p className="text-sm text-white font-medium">Scanning job market...</p>
                    <p className="text-xs text-muted-foreground">Analyzing your resume against live listings</p>
                </div>
            )}

            {error && !loading && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-400">{error}</p>
                    <Button variant="ghost" size="sm" onClick={generateRecommendations} className="ml-auto text-red-400 hover:text-red-300 hover:bg-red-500/10">Retry</Button>
                </div>
            )}

            {!loading && hasSearched && recommendations.length === 0 && !error && (
                <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                    <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-sm font-medium text-white">No matching jobs found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        We couldn&apos;t find any new jobs matching your resume right now. Try updating your resume or checking back later.
                    </p>
                    <Button variant="outline" size="sm" onClick={generateRecommendations} className="mt-4 border-white/10 text-white hover:bg-white/5">
                        Try Again
                    </Button>
                </div>
            )}

            {!loading && recommendations.length > 0 && (
                 <div className="flex overflow-x-auto pb-6 gap-6 snap-x -mx-6 px-6 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 transition-colors">
                    {recommendations.map((job) => {
                        // Debugging: Log invalid jobs if any slip through
                        if (!job.url) console.warn("Job missing URL:", job);

                        return (
                        <Card key={job.id} className="min-w-[320px] max-w-[320px] bg-white/5 border-white/10 hover:border-blue-500/30 transition-all flex flex-col overflow-hidden group snap-center">
                           <div className="relative p-4 pb-2">
                                <div className="absolute top-2 right-2">
                                     <Badge className={`backdrop-blur border-white/10 text-white text-xs px-2 py-0.5 ${job.matchScore > 80 ? 'bg-green-500/60' : 'bg-blue-500/60'}`}>
                                         {job.matchScore}% Match
                                     </Badge>
                                </div>
                                <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors pr-20 line-clamp-1">
                                    {job.role}
                                </h3>
                                <div className="flex items-center gap-2 text-muted-foreground mt-2 text-xs">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[120px]">{job.company_name}</span>
                                    <span className="text-white/20">•</span>
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[100px]">{job.location}</span>
                                </div>
                           </div>
                            
                            <CardHeader className="p-4 pb-2">
                                <CardDescription className="line-clamp-2 text-xs mt-1 h-8">
                                    <span className="text-blue-300 font-medium">Why: </span> {job.reason}
                                </CardDescription>
                            </CardHeader>
                            
                            <CardFooter className="p-4 pt-auto mt-auto flex items-center justify-between text-xs text-muted-foreground">
                                <span>Posted {formatDistanceToNow(new Date(job.date_posted), { addSuffix: true })}</span>
                                {job.url ? (
                                    <Button variant="secondary" size="sm" className="h-8 gap-2" asChild>
                                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                                           Apply <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </Button>
                                ) : (
                                    <Button variant="secondary" size="sm" className="h-8 gap-2 opacity-50 cursor-not-allowed" disabled>
                                        No Link <ExternalLink className="h-3 w-3" />
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )})}
                 </div>
            )}
        </div>
    );
}
