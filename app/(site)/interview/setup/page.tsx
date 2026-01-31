import InterviewSetupForm from "./interview-setup-form"

export default function InterviewSetupPage() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black font-sans">
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_70%)]"
        aria-hidden="true"
      />
      
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 px-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-white tracking-tight">Interview Setup</h1>
            <p className="text-muted-foreground">Configure your mock interview session details below.</p>
        </div>

        <InterviewSetupForm />

      </div>
    </main>
  )
}

