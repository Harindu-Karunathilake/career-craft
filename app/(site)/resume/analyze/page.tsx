"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, FileText, CheckCircle2, Loader2, Play } from "lucide-react"
import { useState, ChangeEvent } from "react"
import { usePuterStore } from "@/lib/puter"
import { convertPdfToImage } from "@/lib/pdf2img"
import { prepareInstructions } from "@/constants/resume-analysis"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { doc, setDoc, collection } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { extractTextFromPdf } from "@/lib/pdf2text";

import { motion } from "framer-motion"

export default function ResumeAnalyzePage() {
  const { auth, fs, ai, init } = usePuterStore();
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    init();
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
            setCurrentUser(user);
        } else {
            setCurrentUser(null);
            // Optional: Redirect to login or show non-blocking alert
        }
    });
    return () => unsubscribe();
  }, [init]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        setFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !jobTitle || !companyName || !jobDescription) return;
    
    // Puter Auth Check
    if (!auth.isAuthenticated) {
        setStatusText("Please sign in to Puter.js...");
        await auth.signIn();
        // Wait for auth to complete? The hook might handle state, but let's re-check
        // In a real flow we might need to wait or rely on the updated state.
        // For now, let's assume sign-in is a blocking popup or flow.
    }
    
    // Re-check auth or proceed if we assume success (or let user click again)
    // Ideally we should wait for auth.isAuthenticated to be true, but that's async via effect.
    // For this attempt, we'll try to proceed, if it fails, error will be caught.

    setIsAnalyzing(true);
    setStatusText("Initializing analysis...");

    try {
        const userId = currentUser?.uid;
        
        if (!userId) {
            setStatusText("Please log in to continue.");
            // Optionally redirect here if you want to force it
            // router.push("/login?next=/resume/analyze"); 
            return;
        }

        // 1. Extract Text Locally (Bypass Puter FS)
        setStatusText("Extracting text from resume...");
        let resumeText = "";
        try {
            resumeText = await extractTextFromPdf(file);
            console.log("Text extraction successful, length:", resumeText.length);
        } catch (err) {
            console.error("Text extraction failed:", err);
            throw new Error("Failed to extract text from PDF. Please try a different file.");
        }

        // 2. Convert to Image (for visual preview)
        setStatusText("Processing document...");
        const imageResult = await convertPdfToImage(file);
        if (!imageResult.file) {
            console.error("PDF Conversion Error:", imageResult.error);
            throw new Error(`Failed to convert PDF: ${imageResult.error}`);
        }

        // 3. Upload to Firebase Storage (via Encrypted API)
        setStatusText("Encrypting and saving documents...");
        
        const uploadFile = async (fileToUpload: File) => {
            const formData = new FormData();
            formData.append("file", fileToUpload);
            
            // Get current auth token
            const token = await currentUser.getIdToken();
            
            const res = await fetch("/api/resumes/upload", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error("Upload API Error:", res.status, errorText);
                throw new Error(`Upload failed: ${res.status} ${errorText}`);
            }
            return res.json();
        };

        const [resumeUpload, imageUpload] = await Promise.all([
            uploadFile(file),
            uploadFile(imageResult.file)
        ]);

        const resumeUrl = resumeUpload.storagePath; // Stores path, not URL
        const imageUrl = imageUpload.storagePath;

        // 4. Run AI Analysis


        // 4. Run AI Analysis
        setStatusText("Analyzing content against job description...");
        
        // Debug: Log extracted text details
        console.log(`Resume Text Length: ${resumeText.length}`);
        console.log(`Resume Text Snippet: ${resumeText.substring(0, 200)}...`);

        // Debug: Test AI Connectivity
        try {
            console.log("Testing AI connectivity with simple prompt...");
            const testResponse = await ai.chat("Hello, are you working?");
            console.log("AI Test Response:", testResponse);
        } catch (testError) {
            console.error("AI Connectivity Test Failed:", testError);
        }

        // Construct the prompt manually since we are using raw text
        const instructions = prepareInstructions({ jobTitle, jobDescription });
        const fullPrompt = `
RESUME CONTENT:
${resumeText}

${instructions}
        `.trim();

        console.log("Sending full analysis prompt to AI...");
        const feedback = await ai.chat(fullPrompt);
        
        console.log("AI Feedback Result:", feedback);

        if (!feedback) {
            console.error("AI returned null/undefined feedback");
            throw new Error("AI Analysis failed (No response)");
        }


        const feedbackText = typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        // Parse JSON
        const jsonMatch = feedbackText.match(/```json\s*([\s\S]*?)\s*```/) || feedbackText.match(/```\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : feedbackText;
        let analysisData;
        try {
            analysisData = JSON.parse(jsonString);
        } catch (e) {
            console.error(e);
            // Fallback or retry? For now, throw.
            throw new Error("Failed to parse AI response");
        }

        // 5. Save to Firestore
        setStatusText("Finalizing results...");
        const resumeId = doc(collection(firebaseDb, "users", userId, "resumes")).id;
        
        console.log("Saving to Firestore:", { resumeUrl, imageUrl });

        await setDoc(doc(firebaseDb, "users", userId, "resumes", resumeId), {
            id: resumeId,
            companyName,
            jobTitle,
            jobDescription,
            imageUrl,
            resumeUrl,
            analysis: analysisData,
            isEncrypted: true, // Flag new encryption
            createdAt: new Date().toISOString(),
        });

        // 6. Redirect
        setStatusText("Done!");
        router.push(`/resume/${resumeId}`);

    } catch (error: any) {
        console.error("Analysis Error:", error);
        setStatusText(`Error: ${error.message || "Something went wrong"}`);
        setIsAnalyzing(false); // Stop loading so user can retry
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.1),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8 px-6"
      >
        
        {/* Header */}
        <div className="text-center space-y-4">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
                Resume Analysis
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg text-white/60"
            >
                Upload your resume to get AI-powered feedback.
            </motion.p>
        </div>

        {/* Upload Card */}
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full"
        >
            <Card className="w-full overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
                 
                 {/* Job Details Form */}
                 <div className="p-6 pb-0 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="job-title" className="text-white">Job Title</Label>
                            <Input 
                                id="job-title" 
                                placeholder="e.g. Senior Product Manager" 
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500/50"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company" className="text-white">Company Name</Label>
                            <Input 
                                id="company" 
                                placeholder="e.g. Google" 
                                className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-indigo-500/50"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-white">Job Description</Label>
                        <Textarea 
                            id="description" 
                            placeholder="Paste the job description here..." 
                            className="min-h-[100px] bg-black/20 border-white/10 text-white placeholder:text-white/30 resize-none focus-visible:ring-indigo-500/50"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                        />
                    </div>
                 </div>

                 <div 
                    className="p-10 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl bg-black/20 m-6 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 group cursor-pointer relative"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                 >
                    <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="h-16 w-16 mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center transition-colors group-hover:bg-indigo-500/30"
                    >
                        <UploadCloud className="h-8 w-8 text-indigo-400" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        {file ? "File selected" : "Click to upload or drag and drop"}
                    </h3>
                    <p className="text-sm text-white/40 text-center max-w-xs">
                        {file ? file.name : "PDF, DOCX up to 10MB. We will analyze your resume for keywords, formatting, and impact."}
                    </p>
                    <Input 
                        type="file" 
                        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" 
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                    />
                 </div>

                 {file && (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="px-6 pb-6 space-y-4"
                     >
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500/20">
                                <FileText className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                     </motion.div>
                 )}
            </Card>
        </motion.div>

        {/* Action Button */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="w-full flex flex-col items-center gap-4"
        >
            <Button 
                size="lg" 
                className="h-12 min-w-[200px] rounded-full bg-indigo-600 text-base font-medium text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAnalyze}
                disabled={!file || !jobTitle || !companyName || !jobDescription || isAnalyzing}
            >
                {isAnalyzing ? (
                   <>
                     <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                     analyzing...
                   </>
                ) : (
                    <>
                      Start Analysis <Play className="ml-2 h-4 w-4 fill-current" />
                    </>
                )}
            </Button>
            
            {statusText && (
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm ${statusText.startsWith("Error") ? "text-red-400" : "text-indigo-300"} animate-pulse`}
                >
                    {statusText}
                </motion.p>
            )}

            {!auth.isAuthenticated && (
                <p className="text-xs text-white/40">
                    Note: Analysis is powered by Puter.js and requires a separate sign-in.
                </p>
            )}
        </motion.div>

      </motion.div>
    </main>
  )
}
