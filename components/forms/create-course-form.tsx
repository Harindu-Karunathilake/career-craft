"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { firebaseDb, firebaseAuth, firebaseStorage } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Lock } from "lucide-react"

import { CourseBuilder } from "./course-builder"
import { Chapter } from "@/types"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  content: z.string().optional(), // Make optional as chapters might replace it
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  coverImage: z.string().optional(),
})

interface CreateCourseFormProps {
  initialData?: {
    id: string
    title: string
    description: string
    content?: string
    price: number
    coverImage?: string
    chapters?: Chapter[]
  }
}

export function CreateCourseForm({ initialData }: CreateCourseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>(initialData?.chapters || [])
  const [userStatus, setUserStatus] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    async function checkUserStatus() {
        const user = firebaseAuth.currentUser;
        if (user) {
            try {
                const userDoc = await getDoc(doc(firebaseDb, "users", user.uid));
                if (userDoc.exists()) {
                    setUserStatus(userDoc.data().status);
                }
            } catch (err) {
                console.error("Error fetching user status:", err);
            }
        }
        setCheckingStatus(false);
    }
    checkUserStatus();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      content: initialData?.content || "",
      price: initialData?.price || 0,
      coverImage: initialData?.coverImage || "",
    },
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return

      // Basic validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError("Image size should be less than 5MB")
          return
      }

      setUploadingImage(true)
      setError(null)
      try {
          const storageRef = ref(firebaseStorage, `courses/covers/${Date.now()}_${file.name}`)
          const snapshot = await uploadBytes(storageRef, file)
          const downloadURL = await getDownloadURL(snapshot.ref)
          
          form.setValue("coverImage", downloadURL)
      } catch (err) {
          console.error("Error uploading image:", err)
          setError("Failed to upload image. Please try again.")
      } finally {
          setUploadingImage(false)
      }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const user = firebaseAuth.currentUser
      
      if (!user) {
        setError("You must be logged in to create a course.")
        return
      }

      if (userStatus !== 'active') {
          setError("Your tutor account must be verified by an admin before you can publish courses.")
          return
      }

      if (initialData) {
          // Update existing course
          const { doc, updateDoc } = await import("firebase/firestore")
          await updateDoc(doc(firebaseDb, "courses", initialData.id), {
              ...values,
              chapters,
              updatedAt: serverTimestamp(),
          })
      } else {
          // Create new course
          await addDoc(collection(firebaseDb, "courses"), {
            ...values,
            chapters, // Include the chapters from state
            tutorId: user.uid,
            tutorName: user.displayName || "Unknown Tutor",
            tutorEmail: user.email,
            published: true, // Auto-publish for now or could add a toggle
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
      }

      router.push("/tutor/courses")
      router.refresh()
    } catch (e) {
      console.error("Error saving course:", e)
      setError("Failed to save course. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRestricted = !checkingStatus && userStatus !== 'active';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        {error && (
          <Alert variant="destructive">
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isRestricted && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500">
                <Lock className="h-4 w-4" />
                <AlertTitle>Verification Required</AlertTitle>
                <AlertDescription>
                    Your tutor account is currently <strong>{userStatus || "pending"}</strong>. 
                    You must be verified by an admin before you can delete or publish courses.
                </AlertDescription>
            </Alert>
        )}
        
        <div className="grid gap-8 md:grid-cols-2">
            <div className={`space-y-8 ${isRestricted ? "opacity-60 pointer-events-none" : ""}`}>
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                        <Input placeholder="Introduction to React" {...field} />
                    </FormControl>
                    <FormDescription>
                        This is the public display name of your course.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
                
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                        <Textarea 
                            placeholder="Learn the basics of React including hooks..." 
                            className="resize-none" 
                            {...field} 
                        />
                    </FormControl>
                    <FormDescription>
                        A brief summary of what students will learn.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />

                {/* Cover Image Field */}
                <div className="space-y-4">
                    <FormLabel>Cover Image</FormLabel>
                    <div className="flex items-center gap-4">
                        <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            disabled={uploadingImage || isSubmitting}
                        />
                        {uploadingImage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                    {form.watch("coverImage") && (
                        <div className="mt-2 relative aspect-video w-40 overflow-hidden rounded-md border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={form.watch("coverImage")} alt="Cover preview" className="object-cover w-full h-full" />
                        </div>
                    )}
                    <FormDescription>
                        Upload a cover image for your course card (max 5MB).
                    </FormDescription>
                </div>
                 <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Price (LKR)</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                        </FormControl>
                        <FormDescription>
                            Set to 0 for free courses.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </div>

            <div className={`space-y-8 ${isRestricted ? "opacity-60 pointer-events-none" : ""}`}>
                 <CourseBuilder chapters={chapters} setChapters={setChapters} />
            </div>
        </div>

        <Button type="submit" disabled={isSubmitting || uploadingImage || isRestricted} size="lg" className="w-full md:w-auto">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? "Save Changes" : "Publish Course"}
        </Button>
      </form>
    </Form>
  )
}
