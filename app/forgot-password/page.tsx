"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSuccess(false)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black relative overflow-hidden px-4">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
             <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.85)_85%)]"
              aria-hidden="true"
            />
             <motion.div 
               animate={{
                 y: [0, -20, 0],
                 opacity: [0.3, 0.5, 0.3],
               }}
               transition={{
                 duration: 8,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
               className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]"
             />
             <motion.div 
                animate={{
                 y: [0, 20, 0],
                 opacity: [0.2, 0.4, 0.2],
               }}
               transition={{
                 duration: 10,
                 repeat: Infinity,
                 ease: "easeInOut",
                 delay: 1
               }}
               className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px]"
             />
        </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
          <Card className="w-full border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                Reset password
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter your email address and we&apos;ll send you a link to reset your
                password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {isSuccess ? (
                <Alert className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Check your email for a link to reset your password. If you don&apos;t
                    see it, check your spam folder.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      value={email}
                      disabled={isSubmitting}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/50"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isSubmitting}>
                    {isSubmitting ? "Sending link..." : "Send reset link"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t border-white/10 p-4">
              <p className="text-sm text-zinc-400">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline">
                  Back to login
                </Link>
              </p>
            </CardFooter>
          </Card>
      </motion.div>
    </div>
  )
}
