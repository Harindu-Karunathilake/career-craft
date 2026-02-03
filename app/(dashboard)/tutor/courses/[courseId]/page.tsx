"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, DollarSign, BookOpen } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function CourseDetailsPage() {
  const params = useParams()
  const { courseId } = params as { courseId: string }
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourse() {
      if (!courseId) return

      try {
        const docRef = doc(firebaseDb, "courses", courseId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() })
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <Button asChild variant="ghost" className="pl-0 hover:pl-2 transition-all">
        <Link href="/tutor/courses" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <div>
                 <Badge className="mb-2">{course.published ? "Published" : "Draft"}</Badge>
                 <h1 className="text-4xl font-bold tracking-tight">{course.title}</h1>
                 <p className="text-xl text-muted-foreground mt-2">{course.description}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-muted-foreground">{course.content}</pre>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Price
                        </span>
                        <span className="font-semibold text-lg">
                            {course.price > 0 ? `$${course.price}` : "Free"}
                        </span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Created
                        </span>
                        <span className="text-sm">
                            {course.createdAt?.seconds ? new Date(course.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </span>
                    </div>
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <BookOpen className="h-4 w-4" /> Author
                        </span>
                        <span className="text-sm truncate max-w-[150px]">
                            {course.tutorName}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
