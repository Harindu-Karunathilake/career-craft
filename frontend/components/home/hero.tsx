"use client"

import { motion } from "framer-motion"
// import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="min-h-screen relative flex w-full flex-1 items-center justify-center overflow-hidden">
      {/* Background Gradients & Effects - MOVED TO GLOBAL */}
      {/* <div className="absolute inset-0 z-0"> ... </div> */}

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-4"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-indigo-400">
            CareerCraft Platform
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-white sm:text-7xl">
            Build your next career move <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              with precision.
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-2xl text-lg text-zinc-400 sm:text-xl"
        >
           Log in to continue where you left off or create a workspace to start managing job applications, interviews,
           and networking efforts in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200">
              Get Started
            </Button>
          </Link>
           <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30">
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
