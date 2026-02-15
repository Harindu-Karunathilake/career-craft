"use client"

import { LoginForm } from "@/components/forms/login-form"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-zinc-950 dark:bg-black relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_50%)]" />

      <div className="mx-auto grid min-h-dvh w-full min-w-screen grid-cols-1 overflow-hidden lg:h-dvh lg:grid-cols-2 relative z-10">
        <section className="relative flex h-full flex-col justify-end overflow-hidden p-8 text-white lg:p-12">
            
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-black/50 z-0" 
          />
           <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_55%)] opacity-70 z-0"
            aria-hidden="true"
          />
          
          <div className="relative z-10 max-w-lg space-y-6 mb-10 lg:mb-20">
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300"
            >
                Career Craft
            </motion.p>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl font-bold leading-tight sm:text-5xl"
            >
              Welcome back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                future maker.
              </span>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg text-zinc-300 max-w-md"
            >
              Pick up right where you left off. Track applications, refine resumes, and stay ahead with curated insights.
            </motion.p>
          </div>
        </section>
        
        <section className="flex items-center justify-center bg-zinc-950/50 backdrop-blur-xl px-6 py-12 lg:h-full lg:px-12 lg:py-0 border-t lg:border-t-0 lg:border-l border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full max-w-md lg:max-w-sm"
          >
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-xl backdrop-blur-md">
                 <LoginForm />
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
