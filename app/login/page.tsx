import { LoginForm } from "@/components/forms/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-zinc-50/60 dark:bg-black">
      <div className="mx-auto grid min-h-dvh w-full min-w-screen grid-cols-1 overflow-hidden rounded-none lg:h-dvh lg:grid-cols-2  lg:shadow-2xl">
        <section className="relative flex h-72 flex-col justify-end overflow-hidden bg-linear-to-br from-indigo-600 via-purple-600 to-slate-900 p-8 text-white sm:h-96 lg:h-full lg:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)] opacity-70"
            aria-hidden="true"
          />
          <div className="relative max-w-lg space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Career Craft</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Welcome back, future maker.
            </h1>
            <p className="text-base text-white/80">
              Pick up right where you left off. Track applications, refine resumes, and stay ahead with curated insights.
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center bg-white/80 px-6 py-12 dark:bg-zinc-950/80 sm:px-10 lg:h-full lg:px-12 lg:py-0">
          <div className="w-full max-w-md lg:max-w-sm">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  )
}
