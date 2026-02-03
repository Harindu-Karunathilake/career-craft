"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firebaseDb, firebaseAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, BookOpen, Clock, DollarSign, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    published: boolean;
    createdAt: any;
}

export default function TutorCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
             const user = firebaseAuth.currentUser;
             if (!user) return;

             try {
                 const q = query(
                     collection(firebaseDb, "courses"),
                     where("tutorId", "==", user.uid)
                 );
                 
                 const querySnapshot = await getDocs(q);
                 const fetchedCourses: Course[] = [];
                 querySnapshot.forEach((doc) => {
                     fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
                 });
                 
                 // Sort client-side to avoid Firestore composite index requirement
                 fetchedCourses.sort((a, b) => {
                    const dateA = a.createdAt?.seconds || 0;
                    const dateB = b.createdAt?.seconds || 0;
                    return dateB - dateA;
                 });

                 setCourses(fetchedCourses);
             } catch (error) {
                 console.error("Error fetching courses:", error);
                 // Fallback if index is missing (common in Firestore)
                 // Just fetch by tutorId then client sort if needed, or prompt user to create index
             } finally {
                 setLoading(false);
             }
        };

         const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                fetchCourses();
            } else {
                 setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
             <div className="flex items-center justify-between">
                <div>
                     <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Content Management</p>
                    <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                    <p className="text-muted-foreground mt-1">Create and manage your educational content.</p>
                </div>
                <Button asChild className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20">
                    <Link href="/tutor/courses/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Course
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div>Loading courses...</div>
            ) : courses.length === 0 ? (
                 <Card className="bg-white/5 border-white/10 p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">No courses published</h3>
                         <p className="text-muted-foreground max-w-sm mx-auto">
                            Share your knowledge with the world. Create your first course today.
                        </p>
                        <Button asChild className="mt-4" variant="outline">
                            <Link href="/tutor/courses/create">Create Course</Link>
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                        <Card key={course.id} className="flex flex-col overflow-hidden bg-card text-card-foreground shadow-sm hover:shadow-md transition-all">
                             <div className="aspect-video w-full bg-muted/20 flex items-center justify-center relative">
                                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                                <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur text-foreground border-none">
                                    {course.published ? "Published" : "Draft"}
                                </Badge>
                             </div>
                             <CardHeader className="p-4">
                                 <div className="flex justify-between items-start">
                                    <CardTitle className="line-clamp-1 text-lg">{course.title}</CardTitle>
                                 </div>
                                 <CardDescription className="line-clamp-2 text-sm mt-1">
                                     {course.description}
                                 </CardDescription>
                             </CardHeader>
                             <CardContent className="p-4 pt-0 flex-1">
                                 <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                     <div className="flex items-center gap-1">
                                         <Clock className="h-3 w-3" />
                                         <span>Created {new Date(course.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                     </div>
                                     <div className="flex items-center gap-1">
                                         <DollarSign className="h-3 w-3 " />
                                         <span>{course.price > 0 ? `$${course.price.toFixed(2)}` : 'Free'}</span>
                                     </div>
                                 </div>
                             </CardContent>
                             <CardFooter className="p-4 border-t bg-muted/5 flex justify-between">
                                 <Button variant="ghost" size="sm" asChild>
                                     <span className="text-muted-foreground">Edit</span>
                                 </Button>
                                 <Button variant="secondary" size="sm" asChild>
                                      <Link href={`/tutor/courses/${course.id}`}>View</Link>
                                 </Button>
                             </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
