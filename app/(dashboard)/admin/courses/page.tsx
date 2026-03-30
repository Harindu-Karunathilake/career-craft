"use client"

import { useEffect, useState } from "react"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore"
import { Flag, Loader2, Trash2, CheckCircle, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { firebaseDb } from "@/lib/firebase"
import Link from "next/link"

type Course = {
  id: string
  title: string
  description: string
  tutorName: string
  price: number
  published: boolean
  createdAt: Date
}

type Report = {
  id: string
  courseId: string
  courseTitle: string
  reason: string
  reporterEmail: string
  status: string
  createdAt: Date
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
        const [coursesSnap, reportsSnap] = await Promise.all([
            getDocs(collection(firebaseDb, "courses")),
            getDocs(collection(firebaseDb, "reports"))
        ])

        const coursesData: Course[] = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Course[]

        const reportsData: Report[] = reportsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Report[]

        setCourses(coursesData.filter(c => c.published))
        setReports(reportsData.filter(r => r.status === 'pending'))
    } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data")
    } finally {
        setIsLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
      if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return

      setActionId(courseId)
      try {
          // Delete course
          await deleteDoc(doc(firebaseDb, "courses", courseId))
          
          // Also update reports related to this course
          const relatedReports = reports.filter(r => r.courseId === courseId)
          for (const report of relatedReports) {
              await updateDoc(doc(firebaseDb, "reports", report.id), {
                  status: 'resolved',
                  resolution: 'course_deleted',
                  updatedAt: serverTimestamp()
              })
          }

          setCourses(prev => prev.filter(c => c.id !== courseId))
          setReports(prev => prev.filter(r => r.courseId !== courseId))
      } catch (err) {
          console.error("Error deleting course:", err)
          setError("Failed to delete course")
      } finally {
          setActionId(null)
      }
  }

  const handleDismissReport = async (reportId: string) => {
      setActionId(reportId)
      try {
          await updateDoc(doc(firebaseDb, "reports", reportId), {
              status: 'dismissed',
              updatedAt: serverTimestamp()
          })
          setReports(prev => prev.filter(r => r.id !== reportId))
      } catch (err) {
          console.error("Error dismissing report:", err)
          setError("Failed to dismiss report")
      } finally {
          setActionId(null)
      }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Course Management</p>
        <h1 className="text-2xl font-semibold text-white">Published & Reported</h1>
      </div>

       {error && (
            <p className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </p>
        )}

      <Tabs defaultValue="published" className="w-full">
         <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="published">
                Published Courses
                <Badge variant="secondary" className="ml-2 h-5 text-[10px] bg-white/10">{courses.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="reported">
                Reported
                {reports.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">{reports.length}</Badge>
                )}
            </TabsTrigger>
         </TabsList>

         <TabsContent value="published" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                     Array.from({ length: 3 }).map((_, idx) => (
                        <Card key={idx} className="border-white/10 bg-white/5 animate-pulse h-64" />
                      ))
                ) : courses.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/50 border border-dashed border-white/10 rounded-lg">
                        <p>No published courses found</p>
                    </div>
                ) : (
                    courses.map((course) => (
                        <Card key={course.id} className="border-white/10 bg-white/5 text-white flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                         <CardTitle className="text-base line-clamp-1" title={course.title}>{course.title}</CardTitle>
                                         <CardDescription className="text-xs text-white/60">by {course.tutorName}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-500">${course.price}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 text-sm space-y-4">
                                <p className="text-white/70 line-clamp-3 text-xs">{course.description}</p>
                            </CardContent>
                             <div className="p-4 border-t border-white/10 grid grid-cols-2 gap-3">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="w-full border border-white/10 hover:bg-white/10"
                                    asChild
                                >
                                    <Link href={`/courses/${course.id}`} target="_blank">
                                        <ExternalLink className="h-4 w-4 mr-2" /> View
                                    </Link>
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                                    onClick={() => handleDeleteCourse(course.id)}
                                    disabled={actionId === course.id}
                                >
                                    {actionId === course.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Delete
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
         </TabsContent>

         <TabsContent value="reported" className="mt-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                 {isLoading ? (
                     Array.from({ length: 2 }).map((_, idx) => (
                        <Card key={idx} className="border-white/10 bg-white/5 animate-pulse h-40" />
                      ))
                ) : reports.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-white/50 border border-dashed border-white/10 rounded-lg">
                        <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50 text-emerald-500" />
                        <p>No active reports! Good job.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <Card key={report.id} className="border-white/10 bg-white/5 text-white">
                             <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                         <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
                                            <Flag className="h-4 w-4" /> Reported Content
                                         </CardTitle>
                                         <p className="text-base font-semibold">{report.courseTitle}</p>
                                    </div>
                                    <span className="text-[10px] text-white/40">{report.createdAt ? report.createdAt.toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm">
                                    <p className="text-white/40 text-xs mb-1">Reason:</p>
                                    <p className="text-white/90">{report.reason}</p>
                                </div>
                                <div className="flex items-center gap-3 justify-end">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => handleDismissReport(report.id)}
                                        disabled={actionId === report.id}
                                    >
                                        Dismiss
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        asChild
                                         className="border-white/10 hover:bg-white/10"
                                    >
                                        <Link href={`/courses/${report.courseId}`} target="_blank">
                                            View Course
                                        </Link>
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="destructive"
                                        onClick={() => handleDeleteCourse(report.courseId)}
                                        disabled={actionId === report.courseId}
                                    >
                                        Delete Course
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
         </TabsContent>
      </Tabs>
    </div>
  )
}
