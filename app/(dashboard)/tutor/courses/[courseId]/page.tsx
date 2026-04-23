"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, BookOpen, PlayCircle, MonitorPlay } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Chapter, Lesson } from "@/types"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CourseDetailsPage() {
  const params = useParams()
  const { courseId } = params as { courseId: string }
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId) return

      try {
        const docRef = doc(firebaseDb, "courses", courseId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data: any = { id: docSnap.id, ...docSnap.data() }
          setCourse(data)
          // Default to first lesson of first chapter if available
          if (data.chapters && data.chapters.length > 0 && data.chapters[0].lessons.length > 0) {
              setActiveLesson(data.chapters[0].lessons[0])
          }
        }
      } catch (error) {
        console.error("Error fetching course:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  if (loading) {
     return <div className="p-8">Loading...</div>
  }

  if (!course) {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            <h1 className="text-xl font-semibold">Course not found</h1>
            <Button asChild className="mt-4" variant="outline">
                <Link href="/tutor/courses">Back to courses</Link>
            </Button>
        </div>
    )
  }

  const chapters: Chapter[] = course.chapters || []

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-4 mb-4">
        <Button asChild variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all">
            <Link href="/tutor/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
            </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight truncate">{course.title}</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
        {/* Main Content Area */}
        <div className="lg:col-span-3 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-2">
            {activeLesson ? (
                <div className="space-y-4">
                {activeLesson.videoUrl && (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                        {(() => {
                            const url = activeLesson.videoUrl || "";
                            
                            // Check if it's a direct video file (mp4, webm, ogg or Firebase Storage URL)
                            const isDirectVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('firebasestorage.googleapis.com');
                            
                            if (isDirectVideo) {
                                return (
                                    <video src={url} controls className="w-full h-full object-contain" />
                                );
                            }

                            const getYouTubeEmbedUrl = (url: string) => {
                                try {
                                    // Handle standard watch URLs (youtube.com/watch?v=ID)
                                    if (url.includes("watch?v=")) {
                                        const id = url.split("watch?v=")[1].split("&")[0];
                                        return `https://www.youtube.com/embed/${id}`;
                                    }
                                    // Handle short URLs (youtu.be/ID)
                                    if (url.includes("youtu.be/")) {
                                        const id = url.split("youtu.be/")[1].split("?")[0];
                                        return `https://www.youtube.com/embed/${id}`;
                                    }
                                    // Handle embed URLs (youtube.com/embed/ID)
                                    if (url.includes("embed/")) {
                                        return url;
                                    }
                                    return null;
                                } catch {
                                    return null;
                                }
                            };

                            const embedUrl = getYouTubeEmbedUrl(url);

                            return embedUrl ? (
                                <iframe 
                                    src={embedUrl} 
                                    className="w-full h-full" 
                                    title={activeLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                                    <MonitorPlay className="h-16 w-16 mb-4 opacity-50" />
                                    <p>Invalid Video URL</p>
                                </div>
                            );
                        })()}
                    </div>
                )}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                {activeLesson.title}
                                {activeLesson.duration && <span className="text-sm font-normal text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {activeLesson.duration} min</span>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert max-w-none text-sm p-6 pt-0">
                            {(() => {
                                const content = activeLesson.content || activeLesson.description || "No content added yet.";
                                // Basic check if it's HTML from TipTap
                                const isHtml = /<[a-z][\s\S]*>/i.test(content);
                                
                                if (isHtml) {
                                    return <div dangerouslySetInnerHTML={{ __html: content }} />;
                                }
                                
                                // Fallback for old plain-text courses
                                return <p className="whitespace-pre-wrap">{content}</p>;
                            })()}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8 border rounded-lg bg-muted/10">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                        <h2 className="text-xl font-semibold">Welcome to the Course</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mt-2">Select a lesson from the curriculum to start learning.</p>
                    </div>
                </div>
            )}
        </div>

        {/* Sidebar Curriculum */}
        <div className="lg:col-span-1 border rounded-lg bg-card flex flex-col overflow-hidden max-h-[calc(100vh-100px)]">
             <div className="p-4 border-b bg-muted/5">
                <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Course Content
                </h3>
             </div>
             <ScrollArea className="flex-1">
                <div className="p-4">
                     {chapters.length > 0 ? (
                        <Accordion type="multiple" defaultValue={[chapters[0]?.id]} className="space-y-2">
                            {chapters.map((chapter, index) => (
                                <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-md px-2">
                                    <AccordionTrigger className="hover:no-underline py-2 text-sm font-medium">
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Chapter {index + 1}</span>
                                            <span>{chapter.title}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-2">
                                        <div className="space-y-1">
                                            {chapter.lessons.map((lesson) => (
                                                <button
                                                    key={lesson.id}
                                                    onClick={() => setActiveLesson(lesson)}
                                                    className={`w-full flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${
                                                        activeLesson?.id === lesson.id 
                                                            ? "bg-primary/10 text-primary font-medium" 
                                                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    {lesson.videoUrl ? <PlayCircle className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                                                    <span className="truncate flex-1 text-left">{lesson.title}</span>
                                                    {lesson.duration && <span className="text-[10px] opacity-70">{lesson.duration}m</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                     ) : (
                         <p className="text-sm text-muted-foreground text-center py-8">No specific curriculum added.</p>
                     )}
                </div>
             </ScrollArea>
        </div>
      </div>
    </div>
  )
}

