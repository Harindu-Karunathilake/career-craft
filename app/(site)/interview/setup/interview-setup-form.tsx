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
import { Play, Loader2, Sparkles, LayoutDashboard } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseDb, firebaseAuth } from '@/lib/firebase';

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
  });

  const createInterview = useCallback(async (isAutoStart: boolean = false) => {
    if (!formData.role || !formData.experience) return;

    const userId = firebaseAuth.currentUser?.uid;
    // If auto-start and no user, we can't proceed. Ideally we'd redirect to login but for now alert/return
    if (!userId) { 
        if (!isAutoStart) alert("Please log in to start an interview.");
        return; 
    }

    setIsLoading(true);
    
    try {
        // 1. Generate Questions via API
        const response = await fetch('/api/interview/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: formData.role,
                experience: formData.experience,
                topic: formData.topic || 'General',
                type: formData.type,
                questionCount: formData.questionCount
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to generate questions");
        }
        
        const data = await response.json();
        const questions = data.questions;

        // 2. Save to Firebase
        const docRef = await addDoc(collection(firebaseDb, "users", userId, "interviews"), {
            role: formData.role,
            experience: formData.experience,
            topic: formData.topic || 'General',
            type: formData.type,
            questions: questions,
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
        if (!isAutoStart) alert(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
        setIsLoading(false);
    }
  }, [formData, router]);

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

  const handleStartNow = () => {
    if (generatedInterviewId) {
        router.push(`/interview/${generatedInterviewId}`);
    }
  };

  const handleLater = () => {
    router.push('/user/interviews');
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

        {/* Interview Type */}
        <div className="space-y-2">
          <Label htmlFor="type" className="text-white">Interview Type</Label>
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
