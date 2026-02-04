"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
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
import { Loader2, Upload } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }),
  content: z.string().min(50, {
    message: "Course content must be at least 50 characters.",
  }),
  price: z.coerce.number().min(0, {
    message: "Price must be a positive number.",
  }),
  coverImage: z.string().optional(),
})

export function CreateCourseForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      content: "",
      price: 0,
      coverImage: "",
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

      await addDoc(collection(firebaseDb, "courses"), {
        ...values,
        tutorId: user.uid,
        tutorName: user.displayName || "Unknown Tutor",
        tutorEmail: user.email,
        published: true, // Auto-publish for now or could add a toggle
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      router.push("/tutor/courses")
      router.refresh()
    } catch (e) {
      console.error("Error creating course:", e)
      setError("Failed to create course. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        {error && (
          <Alert variant="destructive">
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="## Module 1..." 
                  className="min-h-[200px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                The main content of your course (Markdown supported).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
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

        <Button type="submit" disabled={isSubmitting || uploadingImage}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Publish Course
        </Button>
      </form>
    </Form>
  )
}
