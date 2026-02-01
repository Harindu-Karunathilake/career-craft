"use client"

import { motion, Variants } from "framer-motion"
import { whyChooseUsCards } from "@/data/why-choose-us"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function WhyChooseUsSection() {
  return (
    <section id="why-choose-us" className="relative isolate w-full py-24 bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 text-left sm:px-8 lg:px-0">
        <div className="space-y-4 text-left md:text-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400"
          >
            Why choose us
          </motion.p>
          <motion.h2 
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             className="text-3xl font-semibold text-white sm:text-4xl"
          >
            Designed for ambitious job seekers <br className="hidden md:block" />
            and teams who support them.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-zinc-400 md:mx-auto md:max-w-3xl"
          >
            Bring your interviews, networking, and application workflow together. Every playbook, reminder, and insight stays
            synced so you can focus on telling your story.
          </motion.p>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {whyChooseUsCards.map((card) => (
            <motion.div key={card.title} variants={itemVariants}>
              <Card className="h-full border-white/10 bg-white/5 backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/20">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl text-zinc-50">{card.title}</CardTitle>
                  <CardDescription className="text-sm text-zinc-300">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <Separator className="border-none bg-white/10" decorative />
                <CardContent className="space-y-3 py-4">
                  <ul className="text-sm text-zinc-200">
                    {card.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm font-semibold text-indigo-400">{card.metric}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
