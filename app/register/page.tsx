import { RegisterForm } from "@/components/forms/register-form"

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-zinc-50/60 dark:bg-black">
      <div className="mx-auto grid min-h-dvh w-full min-w-screen grid-cols-1 overflow-hidden rounded-none lg:h-dvh lg:grid-cols-2  lg:shadow-2xl">
        <section className="relative flex h-72 flex-col justify-end overflow-hidden bg-linear-to-br from-emerald-500 via-cyan-500 to-slate-900 p-8 text-white sm:h-96 lg:h-full lg:p-12">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)] opacity-70"
            aria-hidden="true"
          />
          <div className="relative max-w-lg space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Career Craft</p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Start your next chapter.
            </h1>
            <p className="text-base text-white/80">
              Create an account to organize your job hunt, collaborate with mentors, and uncover curated opportunities.
            </p>
          </div>
        </section>
        <section className="flex items-center justify-center bg-white/80 px-6 py-12 dark:bg-zinc-950/80 sm:px-10 lg:h-full lg:px-12 lg:py-0">
          <div className="w-full max-w-md lg:max-w-sm">
            <RegisterForm />
          </div>
        </section>
      </div>
    </main>
  )
}
