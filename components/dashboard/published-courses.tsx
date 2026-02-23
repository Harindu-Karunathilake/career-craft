"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PublishedCourse {
    id: string;
    title: string;
    description: string;
    price: number;
    tutorId: string;
    coverImage?: string;
    createdAt: any;
    tutorName?: string;
}

export function PublishedCoursesList() {
    const [courses, setCourses] = useState<PublishedCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPublishedCourses = async () => {
            try {
                // Query all published courses
                // Requires index: courses collection, where published == true, orderBy createdAt desc
                const q = query(
                    collection(firebaseDb, "courses"),
                    where("published", "==", true),
                    orderBy("createdAt", "desc")
                );
                
                const querySnapshot = await getDocs(q);
                const fetchedCourses: PublishedCourse[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedCourses.push({ id: doc.id, ...doc.data() } as PublishedCourse);
                });
                
                setCourses(fetchedCourses);
            } catch (err: any) {
                console.error("Error fetching published courses:", err);
                 if (err.message && err.message.includes("index")) {
                     setError("Missing Index: check console for link to create index.");
                } else {
                     setError("Failed to load community courses.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedCourses();
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

    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-xl text-center">
                <BookOpen className="h-12 w-12 text-white/20 mb-4" />
                <h3 className="text-xl font-medium text-white">No published courses yet</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    Be the first to share your knowledge with the community!
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
                <Card key={course.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all flex flex-col overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 group">
                    {/* Cover Image */}
                    <div className="relative h-40 w-full bg-zinc-900 border-b border-white/5">
                        {course.coverImage ? (
                            <Image 
                                src={course.coverImage} 
                                alt={course.title} 
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                                <BookOpen className="w-8 h-8 text-emerald-500/40" />
                            </div>
                        )}
                        <div className="absolute top-2 right-2">
                             <Badge className="bg-black/50 backdrop-blur border-white/10 text-white hover:bg-black/60 text-xs px-2 py-0.5">
                                 {course.price > 0 ? `LKR ${course.price.toLocaleString()}` : 'Free'}
                             </Badge>
                        </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base text-white group-hover:text-emerald-400 transition-colors truncate">
                            {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-1 text-xs">
                            {course.description}
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-4 py-2 flex-1">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                             <div className="flex items-center gap-1">
                                 <Clock className="h-3 w-3" />
                                 <span>{course.createdAt?.seconds ? new Date(course.createdAt.seconds * 1000).toLocaleDateString() : 'New'}</span>
                             </div>
                         </div>
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                        <Button variant="outline" size="sm" className="w-full hover:bg-white/5 h-8 text-xs hover:text-emerald-400 group/btn border-white/10" asChild>
                            <Link href={`/courses/${course.id}`}>
                               View Course
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
