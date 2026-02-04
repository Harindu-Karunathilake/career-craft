"use client"

import Image from "next/image"
import { motion, Variants } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Calendar, Clock, Loader2, Globe, User, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { collectionGroup, query, where, orderBy, getDocs } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { PublishedInterview } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    const [interviews, setInterviews] = useState<PublishedInterview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPublishedInterviews = async () => {
            try {
                const q = query(
                    collectionGroup(firebaseDb, "interviews"),
                    where("isPublished", "==", true),
                    orderBy("publishedAt", "desc")
                );
                
                const querySnapshot = await getDocs(q);
                const fetchedInterviews: PublishedInterview[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const authorId = doc.ref.parent.parent?.id;
                    fetchedInterviews.push({ 
                        id: doc.id, 
                        ...data,
                        authorId: authorId
                    } as PublishedInterview);
                });
                
                setInterviews(fetchedInterviews);
            } catch (err: any) {
                console.error("Error fetching published interviews:", err);
                 if (err.message && err.message.includes("index")) {
                     setError("Missing Index");
                } else {
                     setError("Failed to load community interviews.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPublishedInterviews();
    }, []);

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

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">
                        <p>{error}</p>
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <p>No published interviews yet. Be the first!</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
                    >
                        {interviews.map((interview) => (
                            <motion.div key={interview.id} variants={itemVariants}>
                                <Card 
                                    className="h-full group overflow-hidden rounded-2xl border-white/10 bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-indigo-500/30 hover:bg-white/10 ring-0 outline-none backdrop-blur-sm flex flex-col"
                                >
                                    <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                                        {interview.coverImage ? (
                                            <Image 
                                                src={interview.coverImage} 
                                                alt={interview.role}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                                <Globe className="w-12 h-12 text-white/20" />
                                            </div>
                                        )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                        <Badge variant="secondary" className="bg-white/90 text-black backdrop-blur-md shadow-sm border-none font-medium">
                                        {interview.experience}
                                        </Badge>
                                        <Badge className="bg-indigo-600/90 text-white border-none backdrop-blur-md shadow-sm">
                                            {interview.status === 'completed' ? 'Completed' : 'InProgress'}
                                        </Badge>
                                    </div>
                                    </div>
                                    
                                    <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="w-full">
                                            <div className="flex items-center gap-2 mb-2">
                                                 <Avatar className="h-5 w-5 border border-white/10">
                                                     <AvatarImage src={interview.authorImage} />
                                                     <AvatarFallback className="text-[10px] bg-indigo-500/10 text-indigo-400"><User className="h-3 w-3" /></AvatarFallback>
                                                 </Avatar>
                                                 <span className="text-xs text-muted-foreground truncate max-w-[120px]">{interview.authorName || "Anonymous"}</span>
                                            </div>
                                            <CardTitle className="text-lg font-bold leading-tight text-white mb-2 truncate">{interview.role}</CardTitle>
                                             <CardDescription className="text-xs font-medium text-indigo-400 uppercase tracking-wide truncate">{interview.topic}</CardDescription>
                                        </div>
                                    </div>
                                    </CardHeader>
                                    
                                    <CardContent className="p-4 pt-0 space-y-4 flex-1">
                                    
                                    <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-zinc-400 mt-auto">
                                        <div className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>
                                            {interview.publishedAt?.seconds 
                                                ? new Date(interview.publishedAt.seconds * 1000).toLocaleDateString() 
                                                : 'Recently'}
                                        </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>15 min read</span>
                                        </div>
                                    </div>
                                    </CardContent>

                                    <CardFooter className="p-4 pt-0">
                                        <div className="flex w-full gap-2">
                                            <Button variant="outline" className="flex-1 hover:bg-white/5 hover:text-indigo-400 group/btn border-white/10 z-20" asChild>
                                                <Link href={`/interview/setup?role=${encodeURIComponent(interview.role)}&experience=${encodeURIComponent(interview.experience)}&topic=${encodeURIComponent(interview.topic)}&autoStart=true`}>
                                                Attempt
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" className="flex-1 justify-between hover:bg-white/5 hover:text-indigo-400 group/btn z-20" asChild>
                                                <Link href={`/interview/${interview.id}/feedback?uid=${interview.authorId}`}>
                                                    View
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
			</div>
		</section>
	)
}
