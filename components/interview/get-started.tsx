import React from 'react'
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from '../ui/button';
import Link from "next/link"


const GetStarted = () => {
  return (
          <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_60%)] relative flex flex-1 w-full items-center justify-center     text-center  ">
            <div className=" pointer-events-none absolute inset-0 " aria-hidden="true" />
            <BackgroundRippleEffect rows={10} cols={100} cellSize={48} />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_45%,rgba(0,0,0,0.85)_85%)]"
              aria-hidden="true"
            />
            <div className=" mb-10 relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              Interviews
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">
              Create your personalized interviews
            </h1>
              <p className="text-lg text-muted-foreground">
                Get started by creating interviews tailored to your job application using our AI agents. Customize your interview based on number of questions, difficulty, and topics.
              </p>
                <Button asChild size="sm" className="min-w-24" variant="default">
                        <Link href="/login">Create Interview</Link>
                    </Button>
            </div>
          </main>
  )
}

export default GetStarted