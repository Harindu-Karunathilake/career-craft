"use client"

import { motion } from "framer-motion"

const steps = [
	{
		title: "Select your plan",
		description:
			"Choose the interview coaching stack that fits your goals, role seniority, and the markets where you are applying.",
	},
	{
		title: "We handle the prep",
		description:
			"We pair you with mentors, schedule mock loops, and collect scorecards so every form and follow-up is taken care of.",
	},
	{
		title: "Stay ahead with alerts",
		description:
			"Receive feedback summaries, decision updates, and deadline reminders from one secure portal with instant notifications.",
	},
]

export function InterviewHowItWorks() {
	return (
		<section className="relative isolate w-full bg-zinc-950 px-6 py-24 text-white sm:px-10 overflow-hidden">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_65%)]"
				aria-hidden="true"
			/>
			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
				<motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-4 text-left md:text-center"
                >
					<p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">How it works</p>
					<h2 className="text-3xl font-semibold sm:text-4xl text-white">
						A calm, guided path from plan selection to confident interviews.
					</h2>
					<p className="text-base text-zinc-400 md:mx-auto md:max-w-3xl">
						We keep the workflow simple: pick the support you need, we run the operations, you focus on showing up ready.
					</p>
				</motion.div>

				<div className="relative space-y-10 md:space-y-12 md:pl-10">
					{steps.map((step, index) => (
						<motion.div 
                            key={step.title} 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex flex-col justify-center items-center gap-6"
                        >
							<div className="flex flex-col items-center justify-center gap-3 text-sm text-white/80">
								<span className="inline-flex h-8 w-44 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300 border border-indigo-500/20">
									Step {index + 1}
								</span>
							</div>
							<div className="relative rounded-3xl bg-white/5 p-8 w-full max-w-3xl backdrop-blur-md shadow-xl ring-1 ring-white/10 text-center transition-transform hover:scale-[1.01]">
								
								<p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-400 md:hidden mb-2">
									Step {index + 1}
								</p>
								<h3 className="text-2xl font-semibold text-white md:mt-2">{step.title}</h3>
								<p className="mt-3 text-base text-zinc-300 max-w-2xl mx-auto">{step.description}</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	)
}
