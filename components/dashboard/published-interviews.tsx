"use client";

import { useEffect, useState } from "react";
import { collectionGroup, query, where, orderBy, getDocs } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Calendar, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PublishedInterview } from "@/types";

export function PublishedInterviewsList() {
    const [interviews, setInterviews] = useState<PublishedInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPublishedInterviews = async () => {
            try {
                // IMPORTANT: This query requires a Firestore Index to be built.
                // collectionGroup 'interviews' + where 'isPublished' == true + orderBy 'publishedAt' desc
                const q = query(
                    collectionGroup(firebaseDb, "interviews"),
                    where("isPublished", "==", true),
                    orderBy("publishedAt", "desc")
                );
                
                const querySnapshot = await getDocs(q);
                const fetchedInterviews: PublishedInterview[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Extract authorId from the file path: users/{userId}/interviews/{interviewId}
                    const authorId = doc.ref.parent.parent?.id; 
                    fetchedInterviews.push({ 
                        id: doc.id, 
                        ...data,
                        authorId: authorId 
                    } as PublishedInterview);
                });
                
                setInterviews(fetchedInterviews);
            } catch (err: any) {
                console.error("Error fetching published interviews:", err);
                if (err.message && err.message.includes("index")) {
                     setError("Missing Index: check console for link to create index.");
                } else {
                     setError("Failed to load community interviews.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedInterviews();
    }, []);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
         return (
             <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-lg">
                 <p className="text-red-400">{error}</p>
                 <p className="text-sm text-red-400/60 mt-2">Open the browser console if you are the developer to see the index creation link.</p>
             </div>
         )
    }

    if (interviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-xl text-center">
                <Globe className="h-12 w-12 text-white/20 mb-4" />
                <h3 className="text-xl font-medium text-white">No published interviews yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    Be the first to share your interview experience with the community!
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview) => (
                <Card key={interview.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 group">
                    {/* Cover Image */}
                    <div className="relative aspect-video w-full bg-zinc-900">
                        {interview.coverImage ? (
                            <img 
                                src={interview.coverImage} 
                                alt={interview.role} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                <Globe className="w-12 h-12 text-white/20" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2">
                             <Badge className="bg-black/50 backdrop-blur border-white/10 text-white hover:bg-black/60">
                                 {interview.experience}
                             </Badge>
                        </div>
                    </div>

                    <CardHeader className="pb-3">
                         <div className="flex items-center gap-2 mb-2">
                             <Avatar className="h-6 w-6 border border-white/10">
                                 <AvatarImage src={interview.authorImage} />
                                 <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                             </Avatar>
                             <span className="text-xs text-muted-foreground">{interview.authorName || "Anonymous"}</span>
                             <span className="text-xs text-muted-foreground">•</span>
                             <span className="text-xs text-muted-foreground min-w-0 truncate">
                                 {interview.publishedAt?.seconds ? new Date(interview.publishedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                             </span>
                         </div>
                        <CardTitle className="text-lg text-white group-hover:text-indigo-400 transition-colors truncate">
                            {interview.role}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                            {interview.topic}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardFooter className="mt-auto pt-0">
                        <div className="flex w-full gap-2">
                            <Button variant="outline" className="flex-1 hover:bg-white/5 hover:text-indigo-400 group/btn border-white/10" asChild>
                                <Link href={`/interview/setup?role=${encodeURIComponent(interview.role)}&experience=${encodeURIComponent(interview.experience)}&topic=${encodeURIComponent(interview.topic)}&autoStart=true`}>
                                   Attempt
                                </Link>
                            </Button>
                            <Button variant="ghost" className="flex-1 justify-between hover:bg-white/5 hover:text-indigo-400 group/btn" asChild>
                                {/* In a real app, this would link to a public view page. For now, maybe just show feedback or minimal view */}
                                <Link href={`/interview/${interview.id}/feedback?uid=${interview.authorId}`}>
                                    View
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
