"use client"

import React from 'react'
import { motion } from "framer-motion"
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from '../ui/button';
import Link from "next/link"

const GetStarted = () => {
  return (
    <main className="min-h-screen bg-black relative flex flex-1 w-full items-center justify-center text-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
            <BackgroundRippleEffect rows={10} cols={100} cellSize={48} />
             <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.85)_85%)]"
              aria-hidden="true"
            />
             <motion.div 
               animate={{
                 y: [0, -20, 0],
                 opacity: [0.3, 0.5, 0.3],
               }}
               transition={{
                 duration: 8,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
               className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-indigo-500/20 blur-[100px]"
             />
             <motion.div 
                animate={{
                 y: [0, 20, 0],
                 opacity: [0.2, 0.4, 0.2],
               }}
               transition={{
                 duration: 10,
                 repeat: Infinity,
                 ease: "easeInOut",
                 delay: 1
               }}
               className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/20 blur-[100px]"
             />
        </div>

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