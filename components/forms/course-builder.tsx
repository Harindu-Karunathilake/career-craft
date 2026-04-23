"use client";

import { Chapter, Lesson } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Trash, Video, FileText, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { v4 as uuidv4 } from "uuid"; 
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase";
import { useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";

interface CourseBuilderProps {
  chapters: Chapter[];
  setChapters: (chapters: Chapter[]) => void;
}

export function CourseBuilder({ chapters, setChapters }: CourseBuilderProps) {
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadContext, setActiveUploadContext] = useState<{ chapterId: string, lessonId: string } | null>(null);

  const handleLessonVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeUploadContext) return;
      
      const { chapterId, lessonId } = activeUploadContext;
      setUploadingLessonId(lessonId);
      
      try {
          const storageRef = ref(firebaseStorage, `courses/lesson_videos/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          updateLesson(chapterId, lessonId, "videoUrl", url);
      } catch (err) {
          console.error("Failed to upload lesson video:", err);
      } finally {
          setUploadingLessonId(null);
          setActiveUploadContext(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
      }
  };

  const addChapter = () => {
    setChapters([
      ...chapters,
      {
        id: uuidv4(),
        title: "New Chapter",
        lessons: [],
      },
    ]);
  };

  const removeChapter = (id: string) => {
    setChapters(chapters.filter((c) => c.id !== id));
  };

  const updateChapter = (id: string, field: "title", value: string) => {
    setChapters(
      chapters.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addLesson = (chapterId: string) => {
    setChapters(
      chapters.map((c) =>
        c.id === chapterId
          ? {
              ...c,
              lessons: [
                ...c.lessons,
                {
                  id: uuidv4(),
                  title: "New Lesson",
                  description: "",
                  content: "",
                  videoUrl: "",
                  duration: 0,
                  isFree: false,
                },
              ],
            }
          : c
      )
    );
  };

  const removeLesson = (chapterId: string, lessonId: string) => {
    setChapters(
        chapters.map((c) =>
            c.id === chapterId
            ? {
                ...c,
                lessons: c.lessons.filter((l) => l.id !== lessonId)
            }
            : c
        )
    )
  }

  const updateLesson = (chapterId: string, lessonId: string, field: keyof Lesson, value: string | number | boolean) => {
      setChapters(
          chapters.map((c) => 
            c.id === chapterId
            ? {
                ...c,
                lessons: c.lessons.map((l) => 
                    l.id === lessonId ? { ...l, [field]: value } : l
                )
            }
            : c
          )
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Course Curriculum</h3>
        <Button type="button" onClick={addChapter} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Chapter
        </Button>
      </div>

      {/* Hidden input for video uploads */}
      <input type="file" accept="video/*" ref={fileInputRef} onChange={handleLessonVideoUpload} className="hidden" />

      {chapters.length === 0 && (
        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No chapters yet. Click &quot;Add Chapter&quot; to start building your course.</p>
        </div>
      )}

      <Accordion type="multiple" className="space-y-4">
        {chapters.map((chapter, index) => (
          <AccordionItem key={chapter.id} value={chapter.id} className="border rounded-lg bg-card px-4">
            <AccordionTrigger className="hover:no-underline py-4">
               <div className="flex items-center gap-2 flex-1 text-left">
                   <Badge variant="outline" className="mr-2">Chapter {index + 1}</Badge>
                   <span className="font-semibold">{chapter.title}</span>
                   <span className="text-xs text-muted-foreground ml-2">({chapter.lessons.length} lessons)</span>
               </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Label className="w-20">Title:</Label>
                    <Input 
                        value={chapter.title} 
                        onChange={(e) => updateChapter(chapter.id, "title", e.target.value)}
                        className="flex-1"
                    />
                     <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => removeChapter(chapter.id)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>

                <div className="pl-4 space-y-4 border-l-2 border-muted ml-2">
                    {chapter.lessons.map((lesson, lIndex) => (
                        <Card key={lesson.id} className="bg-muted/30">
                            <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="h-5 text-[10px]">Lesson {lIndex + 1}</Badge>
                                    <span className="font-medium text-sm">{lesson.title}</span>
                                </div>
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-red-500/70 hover:text-red-500"
                                    onClick={() => removeLesson(chapter.id, lesson.id)}
                                >
                                    <Trash className="h-3 w-3" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-3 space-y-3">
                                <Input 
                                    placeholder="Lesson Title" 
                                    value={lesson.title}
                                    onChange={(e) => updateLesson(chapter.id, lesson.id, "title", e.target.value)}
                                    className="h-8 text-sm font-medium"
                                />
                                 <div className="grid grid-cols-2 gap-2">
                                    {/* Duration */}
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                        <Input 
                                            type="number" 
                                            placeholder="Min" 
                                            className="h-7 text-xs"
                                            value={lesson.duration || ""}
                                            onChange={(e) => updateLesson(chapter.id, lesson.id, "duration", parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    {/* Preview Toggle */}
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Free Preview?</Label>
                                        <Switch 
                                            checked={lesson.isFree}
                                            onCheckedChange={(c) => updateLesson(chapter.id, lesson.id, "isFree", c)}
                                        />
                                    </div>
                                 </div>
                                
                                <div className="space-y-1">
                                    <Label className="text-xs flex items-center gap-1"><Video className="h-3 w-3" /> Video URL / File</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            placeholder="https://youtube.com/... or upload" 
                                            className="h-8 text-xs flex-1"
                                            value={lesson.videoUrl}
                                            onChange={(e) => updateLesson(chapter.id, lesson.id, "videoUrl", e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            disabled={uploadingLessonId === lesson.id}
                                            onClick={() => {
                                                setActiveUploadContext({ chapterId: chapter.id, lessonId: lesson.id });
                                                fileInputRef.current?.click();
                                            }}
                                        >
                                            {uploadingLessonId === lesson.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                     <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> Description / Content</Label>
                                     <RichTextEditor 
                                        content={lesson.content}
                                        onChange={(html) => updateLesson(chapter.id, lesson.id, "content", html)}
                                     />
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="w-full border-dashed"
                        onClick={() => addLesson(chapter.id)}
                    >
                        <Plus className="mr-2 h-3 w-3" /> Add Lesson
                    </Button>
                </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
