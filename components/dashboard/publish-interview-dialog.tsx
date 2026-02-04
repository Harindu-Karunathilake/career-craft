"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firebaseDb, firebaseStorage, firebaseAuth } from "@/lib/firebase"; // Ensure firebaseAuth is imported
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Loader2, Upload, Link as LinkIcon, Globe } from "lucide-react";
import { toast } from "sonner";
import { Interview } from "@/types";

interface PublishInterviewDialogProps {
    interview: Interview;
    children: React.ReactNode;
    onPublished?: () => void;
}

export function PublishInterviewDialog({ interview, children, onPublished }: PublishInterviewDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<"url" | "upload">("url");

    const handlePublish = async () => {
        const user = firebaseAuth.currentUser;
        if (!user) return; // Should likely show an error or not render

        setLoading(true);
        try {
            let finalImageUrl = imageUrl;

            if (mode === "upload" && file) {
                const storageRef = ref(firebaseStorage, `covers/${user.uid}/${interview.id}/${file.name}-${Date.now()}`);
                const snapshot = await uploadBytes(storageRef, file);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            }

            if (!finalImageUrl && mode === "url" && !imageUrl) {
                 // Validations - maybe optional? Let's make it optional but good to have.
                 // For now, allow publishing without image if they want, or force it?
                 // Plan said "add image", let's assume optional but recommended.
                 // Actually, let's use a default if none provided or just empty.
            }

            const interviewRef = doc(firebaseDb, "users", user.uid, "interviews", interview.id);
            
            await updateDoc(interviewRef, {
                isPublished: true,
                publishedAt: serverTimestamp(),
                coverImage: finalImageUrl || null, // store null if empty
                authorName: user.displayName || "Anonymous",
                authorImage: user.photoURL || null,
                authorId: user.uid
            });

            toast.success("Interview published successfully!");
            setOpen(false);
            if (onPublished) onPublished();
        } catch (error) {
            console.error("Error publishing interview:", error);
            toast.error("Failed to publish interview");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Publish to Community</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Share your interview experience with the community. You can add a cover image to make it stand out.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4 mb-4">
                         <Button 
                            variant={mode === "url" ? "secondary" : "ghost"} 
                            size="sm" 
                            onClick={() => setMode("url")}
                            className="flex-1"
                        >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Image URL
                        </Button>
                        <Button 
                            variant={mode === "upload" ? "secondary" : "ghost"} 
                            size="sm" 
                            onClick={() => setMode("upload")}
                            className="flex-1"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                        </Button>
                    </div>

                    {mode === "url" ? (
                        <div className="space-y-2">
                            <Label htmlFor="url">Cover Image URL</Label>
                            <Input 
                                id="url" 
                                placeholder="https://images.unsplash.com/..." 
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-indigo-500"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="file">Upload Image</Label>
                            <Input 
                                id="file" 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="bg-white/5 border-white/10 file:text-indigo-400"
                            />
                        </div>
                    )}
                    
                    {(imageUrl || file) && (
                        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-white/5 border border-white/10 mt-4">
                           {mode === 'url' && imageUrl && (
                                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                           )}
                           {mode === 'upload' && file && (
                                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                           )}
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white text-xs font-medium uppercase tracking-wider">Preview</span>
                           </div>
                        </div>
                    )}

                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handlePublish} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish Now
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
