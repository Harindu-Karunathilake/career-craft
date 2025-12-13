"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type RssItem = {
	title: string
	link: string
	author: string
	description: string
	thumbnail?: string
	categories?: string[]
	guid?: string
	content?: string
	enclosure?: {
		link?: string
		url?: string
	}
}

type BlogPost = {
	id: string
	title: string
	category: string
	author: string
	summary: string
	image: string
	link: string
}

const RSS_ENDPOINT =
	"https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.summeroftech.co.nz%2Fblog%3Fformat%3Drss"
const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=60"
const POSTS_PER_PAGE = 8

function stripHtml(html: string) {
	const parser = new DOMParser()
	const doc = parser.parseFromString(html, "text/html")
	return doc.body.textContent?.trim() ?? ""
}

function buildSummary(html: string) {
	const clean = stripHtml(html)
	if (clean.length <= 180) return clean
	return `${clean.slice(0, 177)}...`
}

function extractImage(html?: string) {
	if (!html) return null
	const parser = new DOMParser()
	const doc = parser.parseFromString(html, "text/html")
	const img = doc.querySelector("img")
	return img?.getAttribute("src") ?? null
}

export function BlogCardsSection() {
	const [query, setQuery] = useState("")
	const [page, setPage] = useState(1)
	const [posts, setPosts] = useState<BlogPost[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true
		async function loadPosts() {
			setIsLoading(true)
			setError(null)
			try {
				const response = await fetch(RSS_ENDPOINT)
				if (!response.ok) {
					throw new Error(`Failed to fetch articles (${response.status})`)
				}
				const data = await response.json()
				const normalized: BlogPost[] = (data.items as RssItem[]).map((item) => {
					const thumbnail = item.thumbnail?.trim()
					const enclosureImage = item.enclosure?.link || item.enclosure?.url
					const descriptionImage = extractImage(item.description)
					const contentImage = extractImage(item.content)
					return {
						id: item.guid ?? item.link,
						title: item.title,
						category: item.categories?.[0] ?? "Insights",
						author: item.author || data.feed?.title || "TTC Group",
						summary: buildSummary(item.description),
						image: thumbnail || enclosureImage || descriptionImage || contentImage || FALLBACK_IMAGE,
						link: item.link,
					}
				})
				if (isMounted) {
					setPosts(normalized)
				}
			} catch (err) {
				if (isMounted) {
					setError(err instanceof Error ? err.message : "Unable to fetch articles")
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		loadPosts()
		return () => {
			isMounted = false
		}
	}, [])

	const filtered = useMemo(() => {
		const term = query.toLowerCase()
		if (!term) return posts
		return posts.filter((post) => {
			const text = `${post.title} ${post.category} ${post.author}`.toLowerCase()
			return text.includes(term)
		})
	}, [posts, query])

	useEffect(() => {
		setPage(1)
	}, [query])

	const pageCount = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
	const currentPage = Math.min(page, pageCount)
	const startIdx = (currentPage - 1) * POSTS_PER_PAGE
	const visiblePosts = filtered.slice(startIdx, startIdx + POSTS_PER_PAGE)

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
					{error && <p className="text-sm text-red-300">{error}</p>}
				</div>
				{isLoading ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, idx) => (
							<div key={idx} className="h-64 animate-pulse rounded-2xl bg-white/5" />
						))}
					</div>
				) : filtered.length === 0 ? (
					<p className="text-center text-sm text-zinc-300">No articles matched your search.</p>
				) : (
					<>
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
										<Button asChild className="text-xs" variant="secondary">
											<Link href={post.link} target="_blank" rel="noreferrer">
												Read article
											</Link>
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
					</>
				)}
			</div>
		</section>
	)
}
