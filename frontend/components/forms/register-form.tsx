"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { firebaseAuth, firebaseDb } from "@/lib/firebase"

function formatRegisterError(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = String((error as { code?: string }).code)
    switch (code) {
      case "auth/email-already-in-use":
        return "An account already exists with that email."
      case "auth/weak-password":
        return "Password must have at least 6 characters."
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again."
      default:
        return "We couldn't create the account. Please try again."
    }
  }

  return "Something went wrong. Please try again."
}

function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const [wantsUpdates, setWantsUpdates] = useState(true)
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
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
      const trimmedName = fullName.trim()
      if (credential.user && trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName })
      }

      await setDoc(
        doc(firebaseDb, "users", credential.user.uid),
        {
          uid: credential.user.uid,
          name: trimmedName || credential.user.displayName || "",
          email: credential.user.email,
          role,
          status: "active",
          wantsUpdates,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      if (wantsUpdates) {
        console.info("[Register] User opted into updates")
      }

      setIsSuccess(true)
      router.push(role === "tutor" ? "/tutor" : "/user")
    } catch (err) {
      setError(formatRegisterError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl border-border/70 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>
          Share a few details so we can personalize your onboarding experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Registration failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isSuccess && (
          <Alert>
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Account created. Redirecting…</AlertDescription>
          </Alert>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              name="name"
              placeholder="Ada Lovelace"
              required
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label htmlFor="register-password">Password</Label>
              <span className="text-muted-foreground">Min. 8 characters</span>
            </div>
            <Input
              id="register-password"
              name="password"
              type="password"
              placeholder="Create a secure password"
              minLength={8}
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-role">I am a</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="register-role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Candidate</SelectItem>
                <SelectItem value="tutor">Tutor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <fieldset className="space-y-2 rounded-md border border-border/60 p-4 text-sm">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Preferences
            </legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="updates"
                checked={wantsUpdates}
                onChange={(event) => setWantsUpdates(event.target.checked)}
                className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              Send me product updates and tips
            </label>
          </fieldset>
          <Button type="submit" className="w-full" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">

        <p className="text-sm text-muted-foreground">
          Already have an account? <a href="/login" className="font-medium text-primary">Sign in</a>.
        </p>
      </CardFooter>
    </Card>
  )
}

export { RegisterForm }
