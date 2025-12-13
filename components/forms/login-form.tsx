"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { firebaseAuth, firebaseDb } from "@/lib/firebase"

function formatLoginError(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code)
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "The email/password combination is incorrect."
      case "auth/user-not-found":
        return "No account was found for that email."
      case "auth/too-many-requests":
        return "Account temporarily locked due to multiple attempts. Try again later."
      case "auth/network-request-failed":
        return "Network error. Check your connection and retry."
      default:
        return "We couldn't complete the sign-in. Please try again."
    }
  }

  return "Something went wrong. Please try again."
}

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    setError(null)
    setIsSuccess(false)
    setIsSubmitting(true)

    try {
      await setPersistence(
        firebaseAuth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      )

      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)

      let destination = "/user"
      try {
        const userDoc = await getDoc(doc(firebaseDb, "users", credential.user.uid))
        const role = (userDoc.data()?.role as string | undefined) ?? "user"
        if (role === "admin") {
          destination = "/admin"
        }
      } catch (roleError) {
        console.error("Failed to resolve user role", roleError)
      }

      setIsSuccess(true)
      router.push(destination)
    } catch (err) {
      setError(formatLoginError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-xl border-border/70 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with the credentials associated with your CareerCraft account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isSuccess && (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Signed in successfully. Redirecting…</AlertDescription>
          </Alert>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                name="remember"
                className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            <Button variant="ghost" size="sm" type="button" className="px-0 text-primary">
              Forgot password?
            </Button>
          </div>
          
          <Button type="submit" className="w-full" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 text-sm text-muted-foreground">
        <p>
          Don&apos;t have an account? <a href="/register" className="font-medium text-primary">Create one</a>.
        </p>
        <p>
          Support: <a href="mailto:support@careercraft.dev" className="font-medium text-primary">support@careercraft.dev</a>
        </p>
      </CardFooter>
    </Card>
  )
}

export { LoginForm }
