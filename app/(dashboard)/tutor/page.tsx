export default function TutorDashboardPage() {
  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Tutor!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your courses and students today.
          </p>
        </div>
      </div>
      
      {/* Placeholder for dashboard widgets - reusing styles from user dashboard if applicable */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Students</h3>
            </div>
            <div className="p-6 pt-0">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">+0% from last month</p>
            </div>
         </div>
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Active Courses</h3>
            </div>
            <div className="p-6 pt-0">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">+0 since last week</p>
            </div>
         </div>
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
             <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Pending Reviews</h3>
            </div>
            <div className="p-6 pt-0">
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
            </div>
         </div>
         <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
             <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="tracking-tight text-sm font-medium">Total Revenue</h3>
            </div>
            <div className="p-6 pt-0">
                <div className="text-2xl font-bold">$0.00</div>
                <p className="text-xs text-muted-foreground">+0% from last month</p>
            </div>
         </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Your recent actions and course updates.</p>
            </div>
            <div className="p-6 pt-0">
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No recent activity.
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
