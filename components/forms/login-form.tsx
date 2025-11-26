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
import { Input } from "@/components/ui/input"

function LoginForm() {
  return (
    <Card className="w-full max-w-xl border-border/70 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with the credentials associated with your CareerCraft account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form className="space-y-5" action="/api/login" method="post">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
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
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                name="remember"
                className="size-4 rounded border border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              Remember me
            </label>
            <Button variant="ghost" size="sm" type="button" className="px-0 text-primary">
              Forgot password?
            </Button>
          </div>
          
          <Button type="submit" className="w-full" variant="secondary">
            Sign in
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
