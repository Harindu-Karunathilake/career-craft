import Image from "next/image"

import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const publishedInterviews = [
	{
		id: 1,
		company: "Northstar Robotics",
		role: "Senior Product Manager",
		summary: "How Avery navigated a PM loop with systems design, roadmap pitch, and exec alignment.",
		image:
			"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 2,
		company: "Atlas Bio",
		role: "Lead Data Scientist",
		summary: "Breakdown of a technical deep dive plus collaborative case on clinical model drift.",
		image:
			"https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 3,
		company: "Wave Commerce",
		role: "Head of Growth",
		summary: "From whiteboard metrics scenario to storytelling with the CEO in a final panel.",
		image:
			"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 4,
		company: "Lumina Cloud",
		role: "Staff SWE, Platform",
		summary: "Coding challenge, architecture review, and leadership interview all in one day.",
		image:
			"https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=60",
	},
]

export function PublishedInterviews() {
	return (
		<section className="relative isolate w-full bg-black px-6 py-24 text-white sm:px-10">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_65%)]"
				aria-hidden="true"
			/>
			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
				<div className="space-y-4 text-left md:text-center">
					<p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Published interviews</p>
					<h2 className="text-3xl font-semibold sm:text-4xl">Real stories from candidates who shared their loops.</h2>
					<p className="text-base text-zinc-300 md:mx-auto md:max-w-3xl">
						Browse recent interviews, review prep notes, and bookmark insights to use for your next loop.
					</p>
				</div>
				<div className="flex flex-col items-center justify-center gap-3 ">
					<Input
						placeholder="Search interviews, roles, or companies"
						className="bg-white/5 text-white placeholder:text-white/40 md:max-w-sm"
					/>
					
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{publishedInterviews.map((interview) => (
						<Card key={interview.id} className="border-white/10 bg-white/5 text-white backdrop-blur">
							<CardHeader className="p-0">
								<div className="relative h-48 w-full overflow-hidden rounded-t-xl">
									<Image
										src={interview.image}
										alt={interview.company}
										fill
										sizes="(max-width: 768px) 100vw, 25vw"
										className="object-cover" 
									/>
								</div>
								<div className="space-y-1 px-6 pt-4">
									<CardTitle className="text-xl">{interview.company}</CardTitle>
									<CardDescription className="text-zinc-300">{interview.role}</CardDescription>
								</div>
							</CardHeader>
							<CardContent className="px-6 py-4 text-sm text-zinc-200">
								{interview.summary}
							</CardContent>
							<CardFooter className="px-6 pb-6">
								<Button className="w-full" variant="secondary">
									Read interview
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			</div>
		</section>
	)
}
