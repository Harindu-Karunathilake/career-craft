"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { updatePassword, updateProfile } from "firebase/auth"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

// Profile Schema
const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

type ProfileFormValues = z.infer<typeof profileSchema>

// Password Schema
const passwordSchema = z
  .object({
    password: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

export function SettingsView() {
  const { user, loading: authLoading } = useAuth()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Profile Form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  })

  // Password Form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Update profile form values when user loads
  useEffect(() => {
    if (user?.displayName) {
      profileForm.reset({
        name: user.displayName,
      })
    }
  }, [user, profileForm])

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user) return

    setProfileError(null)
    setProfileSuccess(false)

    try {
      await updateProfile(user, {
        displayName: data.name,
      })
      setProfileSuccess(true)
      user.reload()
    } catch (error) {
      console.error(error)
      setProfileError("Failed to update profile. Please try again.")
    }
  }

  async function onPasswordSubmit(data: PasswordFormValues) {
    if (!user) return

    setPasswordError(null)
    setPasswordSuccess(false)

    try {
      await updatePassword(user, data.password)
      setPasswordSuccess(true)
      passwordForm.reset()
    } catch (error: any) {
      console.error(error)
      if (error.code === "auth/requires-recent-login") {
        setPasswordError("For security, please log out and log back in to change your password.")
      } else {
        setPasswordError("Failed to update password. Please try again.")
      }
    }
  }

  if (authLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Preferences</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        </div>
        <div className="p-8 text-center text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Preferences</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update how recruiters and mentors see you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileSuccess && (
              <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your profile has been updated.</AlertDescription>
              </Alert>
            )}
            {profileError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled readOnly className="opacity-70" />
                  <p className="text-[0.8rem] text-muted-foreground">
                    Email cannot be changed directly. Contact support.
                  </p>
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                    {profileForm.formState.isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {passwordSuccess && (
              <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your password has been changed.</AlertDescription>
              </Alert>
            )}
             {passwordError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Min. 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2">
                  <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                    {passwordForm.formState.isSubmitting ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Notifications Card - Static for now */}
        <Card className="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose what lands in your inbox.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="pipeline" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <Label htmlFor="pipeline" className="font-normal">Weekly pipeline summary</Label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="feedback" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <Label htmlFor="feedback" className="font-normal">Interview feedback alerts</Label>
            </div>
            <div className="flex items-center space-x-3">
              <input type="checkbox" id="updates" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <Label htmlFor="updates" className="font-normal">Product updates</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
