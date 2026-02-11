"use client"

import { CreateCourseForm } from "@/components/forms/create-course-form"

export default function CreateCoursePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Create a New Course</h1>
        <p className="text-muted-foreground">
          Fill in the details below to publish your course to the marketplace.
        </p>
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
         <CreateCourseForm />
      </div>
    </div>
  )
}
