"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

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

    const containerVariants: any = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    }

	return (
		<section className="relative isolate w-full min-h-screen px-6 py-24 text-white sm:px-10 overflow-hidden">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(8,145,178,0.15),transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.1),transparent_50%)]" />

			<div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 z-10">
                {/* Header */}
				<div className="space-y-6 text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
					    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-400">From the blog</p>
					    <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Insights & Guidance
                        </h2>
					    <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
						    Curated essays, playbooks, and interviews from industry experts to help you navigate your career journey.
					    </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto"
                    >
					    <Input
						    value={query}
						    onChange={(event) => setQuery(event.target.value)}
						    placeholder="Search articles..."
						    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-cyan-500/50 h-10 rounded-full px-6 transition-all hover:bg-white/10"
					    />
					    {error && <p className="text-sm text-red-400 animate-pulse">{error}</p>}
                    </motion.div>
				</div>

				{isLoading ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, idx) => (
							<div key={idx} className="h-80 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
						))}
					</div>
				) : filtered.length === 0 ? (
						<motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <p className="text-zinc-500 text-lg">No articles found matching &quot;{query}&quot;.</p>
                        <Button variant="link" onClick={() => setQuery("")} className="text-cyan-400 mt-2">Clear search</Button>
                    </motion.div>
				) : (
					<>
						<motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
                        >
							<AnimatePresence mode="popLayout">
                                {visiblePosts.map((post) => (
								    <motion.div key={post.id} variants={itemVariants} layout>
                                        <Card className="group h-full border-white/10 bg-white/5 text-white backdrop-blur-sm overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-900/20">
									        <CardHeader className="p-0">
										        <div className="relative h-48 w-full overflow-hidden">
											        <Image
												        src={post.image}
												        alt={post.title}
												        fill
												        sizes="(max-width: 768px) 100vw, 25vw"
												        className="object-cover transition-transform duration-500 group-hover:scale-105"
											        />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                                    <div className="absolute bottom-3 left-4 right-4">
                                                        <span className="inline-block px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-sm">
                                                            {post.category}
                                                        </span>
                                                    </div>
										        </div>
										        <div className="px-6 pt-5 pb-2">
											        <CardTitle className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
                                                        {post.title}
                                                    </CardTitle>
										        </div>
									        </CardHeader>
									        <CardContent className="px-6 py-2 text-sm text-zinc-400 flex-grow leading-relaxed">
										        <p className="line-clamp-3">{post.summary}</p>
									        </CardContent>
									        <CardFooter className="flex items-center justify-between px-6 pb-6 pt-4 text-xs text-zinc-500 mt-auto border-t border-white/5">
										        <span>{post.author}</span>
										        <Button asChild size="sm" variant="ghost" className="text-xs hover:text-cyan-400 hover:bg-cyan-500/10 p-0 h-auto font-medium">
											        <Link href={post.link} target="_blank" rel="noreferrer" className="flex items-center gap-1">
												        Read <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 6H9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 2.5L9.5 6L6 9.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
											        </Link>
										        </Button>
									        </CardFooter>
								        </Card>
                                    </motion.div>
							    ))}
                            </AnimatePresence>
						</motion.div>
                        
                        {/* Pagination */}
                        {pageCount > 1 && (
						    <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                                className="flex flex-col items-center gap-4 pt-8 text-sm text-zinc-400 md:flex-row md:justify-center border-t border-white/10 mt-8"
                            >
							    <p>
								    Page {currentPage} of {pageCount}
							    </p>
							    <div className="flex gap-2">
								    <Button
									    variant="outline"
                                        size="sm"
									    disabled={currentPage === 1}
									    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                        className="border-white/10 bg-transparent hover:bg-white/5 text-white disabled:opacity-30"
								    >
									    Previous
								    </Button>
								    <Button
									    variant="outline"
                                        size="sm"
									    disabled={currentPage === pageCount}
									    onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                                        className="border-white/10 bg-transparent hover:bg-white/5 text-white disabled:opacity-30"
								    >
									    Next
								    </Button>
							    </div>
						    </motion.div>
                        )}
					</>
				)}
			</div>
		</section>
	)
}
