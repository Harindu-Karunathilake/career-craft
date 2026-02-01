"use client"

import InterviewSetupForm from "./interview-setup-form"
import { motion } from "framer-motion"

export default function InterviewSetupPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 px-6"
      >
        
        {/* Header */}
        <div className="text-center space-y-4">
            <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl font-bold text-white tracking-tight sm:text-5xl"
            >
                Interview Setup
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-lg text-white/60"
            >
                Configure your mock interview session details below.
            </motion.p>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md"
        >
            <InterviewSetupForm />
        </motion.div>

      </motion.div>
    </main>
  )
}

