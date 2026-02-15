"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { CreateCourseForm } from "@/components/forms/create-course-form"
import { useParams } from "next/navigation"

export default function EditCoursePage() {
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
    return <div className="p-8">Loading course details...</div>
  }

  if (!course) {
    return <div className="p-8">Course not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
        <p className="text-muted-foreground">Make changes to your course content and curriculum.</p>
      </div>
      
      <CreateCourseForm initialData={course} />
    </div>
  )
}
