"use client"

import Image from "next/image"
import { motion, Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"

const publishedInterviews = [
	{
		id: 1,
		company: "Northstar Robotics",
		title: "Senior Product Manager",
        type: "Behavioral",
        tech: ["Strategy", "Roadmap", "Leadership"],
		date: "Posted 2 days ago",
		duration: "45 min read",
		image:
			"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60",
        status: "Featured"
	},
	{
		id: 2,
		company: "Atlas Bio",
		title: "Lead Data Scientist",
        type: "Technical",
        tech: ["Deep Learning", "Python", "Clinical Models"],
		date: "Posted 5 days ago",
		duration: "60 min read",
		image:
			"https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=60",
        status: "Popular"
	},
	{
		id: 3,
		company: "Wave Commerce",
		title: "Head of Growth",
        type: "Case Study",
        tech: ["Growth", "Marketing", "Analytics"],
		date: "Posted 1 week ago",
		duration: "30 min read",
		image:
			"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=60",
        status: "New"
	},
	{
		id: 4,
		company: "Lumina Cloud",
		title: "Staff SWE, Platform",
        type: "System Design",
        tech: ["Distributed Systems", "Go", "Kubernetes"],
		date: "Posted 1 week ago",
		duration: "90 min read",
		image:
			"https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=60",
        status: "Detailed"
	},
]

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

export function PublishedInterviews() {
	return (
		<section className="relative isolate w-full px-6 py-24 text-white sm:px-10 overflow-hidden">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.15),transparent_65%)]"
				aria-hidden="true"
			/>
			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
				<motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-4 text-left md:text-center"
                >
					<p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">Published interviews</p>
					<h2 className="text-3xl font-semibold sm:text-4xl">Real stories from candidates who shared their loops.</h2>
					<p className="text-base text-zinc-400 md:mx-auto md:max-w-3xl">
						Browse recent interviews, review prep notes, and bookmark insights to use for your next loop.
					</p>
				</motion.div>
				<div className="flex flex-col items-center justify-center gap-3 mb-8">
					<Input
						placeholder="Search interviews, roles, or companies"
						className="bg-white/5 text-white placeholder:text-zinc-500 md:max-w-sm border-white/10 focus:border-indigo-500/50"
					/>
				</div>
				<motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
                >
					{publishedInterviews.map((interview) => (
						<motion.div key={interview.id} variants={itemVariants}>
                            <Card 
                                className="h-full group overflow-hidden rounded-2xl border-white/10 bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-indigo-500/30 hover:bg-white/10 ring-0 outline-none backdrop-blur-sm"
                            >
                                <div className="relative h-48 w-full overflow-hidden">
                                <Image 
                                    src={interview.image} 
                                    alt={interview.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                    <Badge variant="secondary" className="bg-white/90 text-black backdrop-blur-md shadow-sm border-none font-medium">
                                    {interview.type}
                                    </Badge>
                                    <Badge className="bg-indigo-600/90 text-white border-none backdrop-blur-md shadow-sm">
                                        {interview.status}
                                    </Badge>
                                </div>
                                </div>
                                
                                <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <CardDescription className="text-xs font-medium text-indigo-400 uppercase tracking-wide">{interview.company}</CardDescription>
                                        </div>
                                        <CardTitle className="text-lg font-bold leading-tight text-white mb-2">{interview.title}</CardTitle>
                                    </div>
                                </div>
                                </CardHeader>
                                
                                <CardContent className="p-4 pt-0 space-y-4">
                                <div className="flex flex-wrap gap-1.5 h-12 overflow-hidden content-start">
                                    {interview.tech.map((tech) => (
                                    <span 
                                        key={tech} 
                                        className="inline-flex items-center rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-zinc-300 ring-1 ring-inset ring-white/10"
                                    >
                                        {tech}
                                    </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400">
                                    <div className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{interview.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{interview.duration}</span>
                                    </div>
                                </div>
                                </CardContent>
                            </Card>
                        </motion.div>
					))}
				</motion.div>
			</div>
		</section>
	)
}
