"use client";

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"

import { motion } from "framer-motion"

export default function ResumeResultPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        try {
            
            // Wait for auth state change to get userId reliably
             const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
                 if (user) {
                     const docRef = doc(firebaseDb, "users", user.uid, "resumes", id as string);
                     const docSnap = await getDoc(docRef);
                     
                     if (docSnap.exists()) {
                         setData(docSnap.data());
                     } else {
                         setError("Resume analysis not found.");
                     }
                     setLoading(false);
                 } else {
                    setLoading(false); 
                 }
             });
             
             return () => unsubscribe();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  if (loading) return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-zinc-400">Loading results...</p>
          </div>
      </div>
  );

  if (error || !data) return (
       <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
          <p className="text-red-400">{error || "No data found"}</p>
          <Link href="/resume/analyze"><Button variant="secondary">Try Again</Button></Link>
      </div>
  );
  
  const { analysis, imageUrl, companyName, jobTitle } = data;

  const containerVariants: any = {
      hidden: { opacity: 0 },
      visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
      }
  };

  const itemVariants: any = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_50%)]" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8 relative z-10"
      >
        
        {/* Nav */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
            <Link href="/user/resume">
                <Button variant="ghost" className="text-white hover:bg-white/10 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Resume Preview */}
            <motion.div variants={itemVariants} className="space-y-6">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 h-[calc(100vh-12rem)] sticky top-24 overflow-auto scrollbar-thin scrollbar-thumb-white/20 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold mb-4 text-white/80">Analyzed Resume</h2>
                    {imageUrl ? (
                        <div className="relative w-full h-full min-h-[500px]">
                            <Image 
                                src={imageUrl} 
                                alt="Resume Preview" 
                                width={800} 
                                height={1000}
                                className="w-full h-auto object-contain rounded-lg shadow-2xl"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Preview not available
                        </div>
                    )}
                 </div>
            </motion.div>

            {/* Right: Analysis */}
            <motion.div variants={itemVariants} className="space-y-8">
                <div>
                     <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{jobTitle}</h1>
                     <p className="text-lg text-indigo-400 font-medium">@ {companyName}</p>
                     
                     <div className="flex items-center gap-4 mt-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <span className="text-5xl font-bold text-emerald-400">{analysis?.overallScore}</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Overall Match Score</span>
                            <span className="text-xs text-white/50">Based on AI analysis</span>
                        </div>
                     </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                     {[
                         { label: "ATS Compatibility", score: analysis?.ATS?.score },
                         { label: "Content Quality", score: analysis?.content?.score },
                         { label: "Structure & Format", score: analysis?.structure?.score },
                         { label: "Keywords & Skills", score: analysis?.skills?.score },
                     ].map((item) => (
                         <div key={item.label} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                             <div className="text-sm text-gray-400">{item.label}</div>
                             <div className="text-2xl font-semibold mt-1 text-white">{item.score}%</div>
                             <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${item.score}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-indigo-500 rounded-full" 
                                 />
                             </div>
                         </div>
                     ))}
                </div>

                <div className="w-full h-px bg-white/10" />

                {/* Detailed Feedback */}
                <div className="space-y-6">
                    <FeedbackSection title="ATS Improvements" tips={analysis?.ATS?.tips} />
                    <FeedbackSection title="Structure & Formatting" tips={analysis?.structure?.tips} />
                    <FeedbackSection title="Content Quality" tips={analysis?.content?.tips} />
                    <FeedbackSection title="Skills Analysis" tips={analysis?.skills?.tips} />
                </div>
            </motion.div>
        </div>
      </motion.div>
    </main>
  );
}

function FeedbackSection({ title, tips }: { title: string, tips: any[] }) {
    if (!tips || tips.length === 0) return null;
    return (
        <Card className="bg-white/5 border-white/10 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                {title}
            </h3>
            <div className="space-y-4">
                {tips.map((tip: any, i: number) => (
                    <div key={i} className="flex gap-3 items-start">
                        {tip.type === 'good' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                            <p className="font-medium text-white text-sm">{tip.tip}</p>
                            {tip.explanation && (
                                <p className="text-xs text-muted-foreground mt-1">{tip.explanation}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    )
}
