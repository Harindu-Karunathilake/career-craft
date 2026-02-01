import GetStarted from '@/components/interview/get-started'
import { InterviewHowItWorks } from '@/components/interview/how-it-works'
import { PublishedInterviews } from '@/components/interview/published'
import React from 'react'

const page = () => {
  return (
     <div className="flex min-h-screen flex-col bg-black font-sans">
        <GetStarted />
        <InterviewHowItWorks />
        <PublishedInterviews />
    </div>
  )
}

export default page