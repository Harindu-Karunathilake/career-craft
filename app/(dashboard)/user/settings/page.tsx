import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function UserSettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">Preferences</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2 xl:col-span-1">
            <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update how recruiters and mentors see you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" defaultValue="Avery Kim" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="avery@careercraft.io" />
            </div>
            <div className="pt-2">
                <Button>Save changes</Button>
            </div>
            </CardContent>
        </Card>

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
