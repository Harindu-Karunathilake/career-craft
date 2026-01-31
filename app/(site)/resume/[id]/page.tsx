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

export default function ResumeResultPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        try {
            // Need to wait for auth? 
            // Better to assume auth is persistent or wait for it.
            // For simplicity, we'll try to fetch. If rules require auth, it might fail if not loaded.
            
            // Wait for auth state change if needed?
            // In a real app we'd use an AuthProvider or similar.
            // Let's polling for currentUser for a moment if null?
            
            const userId = firebaseAuth.currentUser?.uid;
            if (!userId) {
                // If checking from a fresh load, might duplicate logic.
                // Assuming client-side hydration has auth.
                // Let's just try.
            }

             // We need to listen to auth state to get userId reliably on refresh
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
                    // Redirect to login?
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
          Loading results...
      </div>
  );

  if (error || !data) return (
       <div className="min-h-screen bg-black flex items-center justify-center text-white flex-col gap-4">
          <p>{error || "No data found"}</p>
          <Link href="/resume/analyze"><Button>Try Again</Button></Link>
      </div>
  );
  
  const { analysis, imageUrl, companyName, jobTitle } = data;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Nav */}
        <div className="flex items-center gap-4">
            <Link href="/user/resume">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Resume Preview */}
            <div className="space-y-6">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 h-[calc(100vh-12rem)] sticky top-24 overflow-auto scrollbar-thin scrollbar-thumb-white/20">
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
            </div>

            {/* Right: Analysis */}
            <div className="space-y-8">
                <div>
                     <h1 className="text-3xl font-bold">{jobTitle} @ {companyName}</h1>
                     <div className="flex items-center gap-2 mt-2">
                        <span className="text-4xl font-bold text-indigo-400">{analysis?.overallScore}/100</span>
                        <span className="text-sm text-muted-foreground">Overall AI Score</span>
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
                         <div key={item.label} className="bg-white/5 p-4 rounded-xl border border-white/10">
                             <div className="text-sm text-gray-400">{item.label}</div>
                             <div className="text-2xl font-semibold mt-1">{item.score}%</div>
                             <div className="h-2 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                                 <div 
                                    className="h-full bg-indigo-500 rounded-full transition-all" 
                                    style={{ width: `${item.score}%` }}
                                 />
                             </div>
                         </div>
                     ))}
                </div>

                <Separator className="bg-white/10" />

                {/* Detailed Feedback */}
                <div className="space-y-6">
                    <FeedbackSection title="ATS Improvements" tips={analysis?.ATS?.tips} />
                    <FeedbackSection title="Structure & Formatting" tips={analysis?.structure?.tips} />
                    <FeedbackSection title="Content Quality" tips={analysis?.content?.tips} />
                    <FeedbackSection title="Skills Analysis" tips={analysis?.skills?.tips} />
                </div>
            </div>
        </div>
      </div>
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
