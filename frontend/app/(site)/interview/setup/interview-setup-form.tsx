'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Loader2, Sparkles, LayoutDashboard, FileText } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseDb, firebaseAuth } from '@/lib/firebase';
import { toast } from 'sonner';
import { extractTextFromPdf } from '@/lib/pdf2text';
import { usePuterStore } from '@/lib/puter';
import { useAuth } from '@/hooks/use-auth';

interface InterviewSetupFormProps {
  initialRole?: string;
  initialTopic?: string;
  initialExperience?: string;
  autoStart?: boolean;
}

export default function InterviewSetupForm({
  initialRole = '',
  initialTopic = '',
  initialExperience = '',
  autoStart = false
}: InterviewSetupFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedInterviewId, setGeneratedInterviewId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    role: initialRole,
    experience: initialExperience,
    topic: initialTopic,
    type: 'Technical',
    questionCount: '5',
    interviewMode: 'voice', // 'voice' | 'coding'
  });
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const { ai } = usePuterStore();

    const createInterview = useCallback(async (isAutoStart: boolean = false) => {
    console.log("createInterview called. Resume File:", resumeFile ? resumeFile.name : "None", "Size:", resumeFile?.size);
    if (!formData.role || !formData.experience) return;

    const userId = firebaseAuth.currentUser?.uid;
    if (!userId) { 
        if (!isAutoStart) toast.error("Please log in to start an interview.");
        return; 
    }

    setIsLoading(true);
    
    try {
        // 0. Validate Role
        if (!isAutoStart) { // Skip validation for auto-start or validate there too if needed, but usually user input needs validation
            const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/validate-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: formData.role })
            });
            
            if (validationResponse.ok) {
                const validationData = await validationResponse.json();
                if (!validationData.isValid) {
                    toast.error(validationData.message || "Invalid job role. Please enter a valid IT/Tech role.");
                    setIsLoading(false);
                    return;
                }
            }
        }

        // 1. Generate Questions via API or Resume Analysis
        let questions = [];
        let resumeText = "";

        if (resumeFile) {
            // Extract text from Resume
            toast.info("Analyzing resume...");
            resumeText = await extractTextFromPdf(resumeFile);
            
            // Generate using Puter JS
            // toast.loading("Generating generic questions relative to your resume...");
                        const prompt = `
                You are an expert technical interviewer.
                I have uploaded a resume for a ${formData.role} position (Experience: ${formData.experience}).
                Focus Topic: ${formData.topic || 'General'}.
                Interview Mode: ${formData.interviewMode}
                
                Resume Content:
                ${resumeText.slice(0, 8000)} {/* Truncate to avoid huge context */}
                
                Generate ${formData.questionCount} ${formData.interviewMode === 'coding' ? 'coding problems' : formData.type + ' interview questions'} based SPECIFICALLY on the projects, skills, and experience in this resume.
                
                ${formData.interviewMode === 'coding' 
                    ? `IMPORTANT: The user has selected a LIVE CODING ASSESSMENT. 
                       Generate ${formData.questionCount} strictly practical CODING CHALLENGES.
                       
                       CRITICAL RULES:
                       1. EVERY question must start with "Write a function...", "Create a component...", or "Implement...".
                       2. Do NOT ask the user to explain anything.
                       3. Do NOT ask about their past experience. Use the resume ONLY to identify which LANGUAGES/FRAMEWORKS to use (e.g., if they know React, ask a React coding question).
                       4. Output PURE PROBLEM STATEMENTS.
                       
                       Example Format: "Write a React component that fetches data from an API and displays it in a list with a filter input."
                       
                       Forbidden Phrasing: "How would you...", "Explain the difference...", "Describe..."`
                    : `Ask about specific details found in the resume text. Keep questions conversational.`
                }
                
                ALSO, extract the candidate's Name and a brief 2-sentence professional summary from the resume to give current context to the interviewer.
                
                Return ONLY a JSON object with this shape: 
                { 
                    "questions": ["Question 1", "Question 2"...],
                    "candidateName": "Name or Candidate",
                    "summary": "Brief summary of candidate..."
                }
                Do not add markdown formatting like \`\`\`json. Just the raw JSON string.
            `;

            console.log("SENDING PROMPT TO AI:", prompt);
            const result = await ai.chat(prompt);
            
            // Parse Puter's response
            // Puter usually returns an object that might need parsing depending on the model/wrapper
            // Assuming result is compatible or we need to extract the text content
            // The lib/puter.ts returns "AIResponse | undefined"
            
            if (result?.message?.content) {
                 const content = typeof result.message.content === 'string' ? result.message.content : JSON.stringify(result.message.content);
                 // Clean markdown code blocks if present
                 const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
                 try {
                    const parsed = JSON.parse(cleanContent);
                    questions = parsed.questions || [];
                    // Small hack to pass the extra data through the same variable temporarily or use a separate one
                    (questions as any).candidateName = parsed.candidateName;
                    (questions as any).summary = parsed.summary;
                 } catch (e) {
                     console.error("Failed to parse AI response", e);
                     // Fallback to simple split if JSON fails or standard generation
                     throw new Error("Failed to parse Resume analysis. Please try again or skip resume.");
                 }
            } else {
                 throw new Error("Failed to get response from AI Analysis.");
            }

        } else {
             // Standard Generation
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: formData.role,
                    experience: formData.experience,
                    topic: formData.topic || 'General',
                    type: formData.type,
                    questionCount: formData.questionCount,
                    interviewMode: formData.interviewMode // Pass the mode
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate questions");
            }
            
            const data = await response.json();
            questions = data.questions;
        }

        // 2. Save to Firebase
        const docRef = await addDoc(collection(firebaseDb, "users", userId, "interviews"), {
            role: formData.role,
            experience: formData.experience,
            topic: formData.topic || 'General',
            type: formData.type,
            interviewMode: formData.interviewMode, // Save the selected mode
            questions: questions,
            resumeContext: {
                candidateName: (questions as any).candidateName || "Candidate",
                summary: (questions as any).summary || "No summary available.",
                fullText: resumeText.slice(0, 15000) 
            },
            status: "pending", // pending, completed
            createdAt: serverTimestamp(),
            interviewType: "Simulated" 
        });

        setGeneratedInterviewId(docRef.id);
        
        if (isAutoStart) {
             router.push(`/interview/${docRef.id}`);
        } else {
             setShowSuccessDialog(true);
        }

    } catch (error) {
        console.error("Setup Error:", error);
        toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
        setIsLoading(false);
    }
  }, [formData, router, resumeFile, ai]);

  useEffect(() => {
      // Auto-start logic
      if (autoStart && formData.role && formData.experience) {
          // Add a small delay or check auth availability
          const checkAuthAndStart = () => {
              const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
                  if (user) {
                      createInterview(true);
                  }
                  unsubscribe();
              });
          };
          checkAuthAndStart();
      }
  }, [autoStart, createInterview, formData.role, formData.experience]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInterview(false);
  };

  const { profile } = useAuth();

  const handleStartNow = () => {
    if (generatedInterviewId) {
        router.push(`/interview/${generatedInterviewId}`);
    }
  };

  const handleLater = () => {
    if (profile?.role === 'tutor') {
        router.push('/tutor/interviews');
    } else {
        router.push('/user/interviews');
    }
  };

  return (
    <>
    <Card className="w-full max-w-xl bg-white/5 border-white/10 backdrop-blur-md p-6 shadow-2xl animate-in fade-in zoom-in duration-500">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Job Role */}
        <div className="space-y-2">
          <Label htmlFor="role" className="text-white">Job Role (Target Position)</Label>
          <Input 
            id="role"
            placeholder="e.g. Senior Frontend Engineer" 
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:ring-indigo-500/50 transition-all"
            required
          />
        </div>

        {/* Interview Mode */}
        <div className="space-y-2">
            <Label className="text-white">Interview Mode</Label>
            <div className="grid grid-cols-2 gap-4">
                <div 
                    onClick={() => setFormData({ ...formData, interviewMode: 'voice' })}
                    className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${formData.interviewMode === 'voice' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5'}`}
                >
                    <span className="text-lg font-semibold">Voice Interview</span>
                    <span className="text-xs text-center opacity-70">Real-time conversational interview with AI avatar</span>
                </div>
                <div 
                    onClick={() => setFormData({ ...formData, interviewMode: 'coding' })}
                    className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all ${formData.interviewMode === 'coding' ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5'}`}
                >
                    <span className="text-lg font-semibold">Live Coding</span>
                    <span className="text-xs text-center opacity-70">Interactive code editor with AI evaluation</span>
                </div>
            </div>
        </div>

        {/* Interview Type - Hidden for Coding Mode */}
        {formData.interviewMode !== 'coding' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="type" className="text-white">Question Type</Label>
            <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
            >
                <SelectTrigger className="bg-black/40 border-white/10 text-white focus:ring-indigo-500/50">
                <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="Behavioral">Behavioral</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
            </Select>
            </div>
        )}

        {/* Experience Level */}
        <div className="space-y-2">
          <Label htmlFor="experience" className="text-white">Experience Level</Label>
          <Select 
            value={formData.experience} 
            onValueChange={(value) => setFormData({ ...formData, experience: value })}
            required
          >
            <SelectTrigger className="bg-black/40 border-white/10 text-white focus:ring-indigo-500/50">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              <SelectItem value="Intern">Intern</SelectItem>
              <SelectItem value="Junior">Junior (0-2 years)</SelectItem>
              <SelectItem value="Mid-Level">Mid-Level (2-5 years)</SelectItem>
              <SelectItem value="Senior">Senior (5+ years)</SelectItem>
              <SelectItem value="Staff/Principal">Staff / Principal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Focus Topic */}
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-white">Focus Topic (Optional)</Label>
          <Input 
            id="topic"
            placeholder="e.g. System Design, React, Leadership" 
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className="bg-black/40 border-white/10 text-white placeholder:text-muted-foreground focus:ring-indigo-500/50 transition-all"
          />
        </div>

        {/* Question Count */}
        <div className="space-y-2">
           <Label htmlFor="questionCount" className="text-white">Number of Questions</Label>
           <Select 
            value={formData.questionCount} 
            onValueChange={(value) => setFormData({ ...formData, questionCount: value })}
          >
            <SelectTrigger className="bg-black/40 border-white/10 text-white focus:ring-indigo-500/50">
              <SelectValue placeholder="Select count" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              <SelectItem value="2">2 Questions (Quick)</SelectItem>
              <SelectItem value="3">3 Questions (Short)</SelectItem>
              <SelectItem value="5">5 Questions (Standard)</SelectItem>
              <SelectItem value="7">7 Questions (Long)</SelectItem>
              <SelectItem value="10">10 Questions (Deep Dive)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resume Upload - Hidden for Coding Mode */}
        {formData.interviewMode !== 'coding' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="resume" className="text-white flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Upload Resume (Optional)
                </Label>
                <div className="flex items-center gap-4">
                    <Input 
                        id="resume"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="bg-black/40 border-white/10 text-white file:text-indigo-400 file:border-0 file:bg-transparent file:font-semibold"
                    />
                </div>
                <p className="text-xs text-zinc-500">
                    Upload your resume (PDF) to get tailored questions based on your actual experience.
                </p>
            </div>
        )}

        <div className="pt-4">
             <Button 
                type="submit" 
                disabled={isLoading || !formData.role || !formData.experience}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Questions...
                    </>
                ) : (
                    <>
                        <Sparkles className="mr-2 h-5 w-5 fill-current" />
                        Generate Interview
                    </>
                )}
            </Button>
        </div>
      </form>
    </Card>

    <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white">
            <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    Interview Ready!
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                    Your questions have been generated successfully. Would you like to start the interview now?
                </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h4 className="font-semibold text-white/90">{formData.role}</h4>
                    <p className="text-sm text-white/60">{formData.experience} • {formData.questionCount} Questions</p>
                </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button variant="ghost" onClick={handleLater} className="text-zinc-400 hover:text-white">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Take Later (Dashboard)
                </Button>
                <Button onClick={handleStartNow} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Play className="mr-2 h-4 w-4" />
                    Start Now
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
