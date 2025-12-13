import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const userRows = [
  { name: "Avery Kim", plan: "Pro", status: "Active", actions: "Reset password" },
  { name: "Jordan Patel", plan: "Pro", status: "Paused", actions: "Resume" },
  { name: "Mara Singh", plan: "Team", status: "Active", actions: "Remove" },
  { name: "Noah Winters", plan: "Starter", status: "Invited", actions: "Resend invite" },
]

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-primary/80">User management</p>
        <h1 className="text-2xl font-semibold text-white">Accounts & status</h1>
      </div>
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle>Team roster</CardTitle>
          <CardDescription className="text-white/70">Live snapshot of user activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userRows.map((user) => (
              <div key={user.name} className="flex flex-wrap items-center gap-4 rounded-lg border border-white/10 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-white/60">Plan: {user.plan}</p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">
                  {user.status}
                </span>
                <Button variant="secondary" size="sm">
                  {user.actions}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
