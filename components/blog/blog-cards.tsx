"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const blogPosts = [
	{
		id: 1,
		title: "Designing interview prep rituals that actually stick",
		category: "Playbooks",
		author: "Avery Kim",
		summary: "A weekly cadence for mixing mock loops, recruiter touchpoints, and rest days without burning out.",
		image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 2,
		title: "Storytelling frameworks for product interviews",
		category: "Product",
		author: "Jordan Patel",
		summary: "Use narrative arcs to explain launch retros, escalations, and roadmap tradeoffs in under five minutes.",
		image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 3,
		title: "Signals hiring managers look for in technical screens",
		category: "Engineering",
		author: "Ravi Sharma",
		summary: "A checklist for communicating decisions out loud during live coding and architecture conversations.",
		image: "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 4,
		title: "Calibrating comp expectations before the offer",
		category: "Career",
		author: "Lina Ortega",
		summary: "How to benchmark equity, cash, and benefits so you come into negotiations grounded and confident.",
		image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 5,
		title: "What to include in your portfolio refresh",
		category: "Design",
		author: "Sydney Park",
		summary: "Actionable prompts for pairing prototypes, metrics, and reflection slides for staff-level roles.",
		image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 6,
		title: "Scaling references that work for you",
		category: "Playbooks",
		author: "Noah Winters",
		summary: "Turn past managers and peers into a ready slate of references with templates and nudge scripts.",
		image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 7,
		title: "Demystifying panel interviews for executives",
		category: "Leadership",
		author: "Morgan Lee",
		summary: "Prep outlines and post-panel follow-up tactics for VP+ candidates navigating multi-hour loops.",
		image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=60",
	},
	{
		id: 8,
		title: "Crafting metrics narratives for growth roles",
		category: "Growth",
		author: "Priya Desai",
		summary: "Map acquisition, activation, and retention storylines that resonate with cross-functional panels.",
		image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=60",
	},
]

const POSTS_PER_PAGE = 8

export function BlogCardsSection() {
	const [query, setQuery] = useState("")
	const [page, setPage] = useState(1)

	const filtered = useMemo(() => {
		return blogPosts.filter((post) => {
			const text = `${post.title} ${post.category} ${post.author}`.toLowerCase()
			return text.includes(query.toLowerCase())
		})
	}, [query])

	const pageCount = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
	const currentPage = Math.min(page, pageCount)
	const startIdx = (currentPage - 1) * POSTS_PER_PAGE
	const visiblePosts = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE)

	useEffect(() => {
		setPage(1)
	}, [query])

	return (
		<section className="relative isolate w-full bg-black px-6 py-24 text-white sm:px-10">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.18),transparent_65%)]"
				aria-hidden="true"
			/>
			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
				<div className="space-y-4 text-left md:text-center">
					<p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">From the blog</p>
					<h2 className="text-3xl font-semibold sm:text-4xl">Playbooks, interviews, and career guidance.</h2>
					<p className="text-base text-zinc-300 md:mx-auto md:max-w-3xl">
						Curated essays from coaches, hiring managers, and candidates to help you stay ready for every stage.
					</p>
				</div>
				<div className="flex flex-col items-center justify-center gap-3 ">
					<Input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search articles, topics, or authors"
						className="bg-white/5 text-white placeholder:text-white/40 md:max-w-sm"
					/>
					
				</div>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{visiblePosts.map((post) => (
						<Card key={post.id} className="border-white/10 bg-white/5 text-white backdrop-blur">
							<CardHeader className="p-0">
								<div className="relative h-48 w-full overflow-hidden rounded-t-xl">
									<Image
										src={post.image}
										alt={post.title}
										fill
										sizes="(max-width: 768px) 100vw, 25vw"
										className="object-cover"
									/>
								</div>
								<div className="space-y-1 px-6 pt-4">
									<CardDescription className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
										{post.category}
									</CardDescription>
									<CardTitle className="text-xl">{post.title}</CardTitle>
								</div>
							</CardHeader>
							<CardContent className="px-6 py-4 text-sm text-zinc-200">
								{post.summary}
							</CardContent>
							<CardFooter className="flex items-center justify-between px-6 pb-6 text-xs text-zinc-400">
								<span>By {post.author}</span>
								<Button className="text-xs" variant="secondary">
									Read article
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
				<div className="flex flex-col items-center gap-3 pt-4 text-sm text-zinc-300 md:flex-row md:justify-end">
					<p>
						Page {currentPage} of {pageCount}
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							disabled={currentPage === 1}
							onClick={() => setPage((prev) => Math.max(1, prev - 1))}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							disabled={currentPage === pageCount}
							onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
						>
							Next
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}
