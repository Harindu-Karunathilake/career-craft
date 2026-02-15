"use client"

import React from 'react'
import { motion } from "framer-motion"
// import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from '../ui/button';
import Link from "next/link"

const GetStarted = () => {
  return (
    <main className="min-h-screen relative flex flex-1 w-full items-center justify-center text-center overflow-hidden">
        {/* Background Effects - REMOVED (Global) */}

        {/* Content */}
        <div className="mb-10 relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6">
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400"
            >
              Resume
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-bold leading-tight text-white sm:text-6xl"
            >
              Analyze your resume and <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                get instant feedback
              </span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-zinc-400 max-w-2xl"
            >
                Get started by analyzing your resume using our AI agents. Customize your analysis based on number of questions, difficulty, and topics.
            </motion.p>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.3 }}
            >
                <Button asChild size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200">
                    <Link href="/resume/analyze">Analyze Resume</Link>
                </Button>
            </motion.div>
        </div>
    </main>
  )
}

export default GetStarted