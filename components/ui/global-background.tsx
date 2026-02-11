"use client"

import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"
import { motion } from "framer-motion"

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <BackgroundRippleEffect rows={15} cols={50} cellSize={40} />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.85)_85%)]"
        aria-hidden="true"
      />
      {/* Animated Orbs */}
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
  )
}
