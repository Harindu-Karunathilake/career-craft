import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function UserSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">Preferences</p>
        <h1 className="text-2xl font-semibold text-white">Control notifications & profile</h1>
      </div>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription className="text-white/70">Update how recruiters and mentors see you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-white/80" htmlFor="name">
              Full name
            </label>
            <Input id="name" defaultValue="Avery Kim" className="mt-1 bg-black/40 text-white" />
          </div>
          <div>
            <label className="text-sm text-white/80" htmlFor="email">
              Email
            </label>
            <Input id="email" type="email" defaultValue="avery@careercraft.io" className="mt-1 bg-black/40 text-white" />
          </div>
          <Button className="w-full">Save changes</Button>
        </CardContent>
      </Card>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription className="text-white/70">Choose what lands in your inbox.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-white/80">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="size-4 rounded border-white/40 bg-transparent" />
            Weekly pipeline summary
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="size-4 rounded border-white/40 bg-transparent" />
            Interview feedback alerts
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="size-4 rounded border-white/40 bg-transparent" />
            Product updates
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
