"use client"

import { SettingsView } from "@/components/settings/settings-view"
import { TutorBankAccountCard } from "@/components/settings/tutor-bank-account-card"
import { useAuth } from "@/hooks/use-auth"

export default function TutorSettingsPage() {
  const { profile } = useAuth()
  const isTutor = profile?.role === "tutor"

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Preferences</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Standard settings cards — embedded inline to avoid duplicate header */}
        <SettingsView embedded />

        {/* Bank / Payout card — tutor only */}
        {isTutor && <TutorBankAccountCard />}
      </div>
    </div>
  )
}
