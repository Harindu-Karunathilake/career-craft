"use client"

import { useState } from "react"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { firebaseDb, firebaseAuth } from "@/lib/firebase"
import { Flag, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ReportDialogProps {
  courseId: string
  courseTitle: string
}

export function ReportDialog({ courseId, courseTitle }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!reason.trim()) {
        toast({
            title: "Reason required",
            description: "Please provide a reason for reporting this course.",
            variant: "destructive"
        })
        return
    }

    setLoading(true)
    try {
      const user = firebaseAuth.currentUser
      
      await addDoc(collection(firebaseDb, "reports"), {
        courseId,
        courseTitle,
        reporterId: user?.uid || "anonymous",
        reporterEmail: user?.email || "anonymous",
        reason,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      toast({
        title: "Report submitted",
        description: "Thank you for bringing this to our attention. We will review it shortly.",
      })
      setOpen(false)
      setReason("")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
          <Flag className="h-4 w-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Course</DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Please describe why this course violates our guidelines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for report</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Inappropriate content, spam, misleading information..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} variant="destructive">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
