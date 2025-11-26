"use client"

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

function RegisterForm() {
  return (
    <Card className="w-full max-w-2xl border-border/70 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create your workspace</CardTitle>
        <CardDescription>
          Share a few details so we can personalize your onboarding experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" action="/api/register" method="post">
          <div className="space-y-2">
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              name="name"
              placeholder="Ada Lovelace"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Work email</Label>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              required
              autoComplete="email"
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
            />
          </div>
          <fieldset className="space-y-2 rounded-md border border-border/60 p-4 text-sm">
            <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Preferences
            </legend>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="updates"
                defaultChecked
                className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              Send me product updates and tips
            </label>
          </fieldset>
          <Button type="submit" className="w-full" variant="secondary">
            Create account
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
