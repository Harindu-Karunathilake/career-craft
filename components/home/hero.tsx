import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"

export function HeroSection() {
  return (
    <section className="min-h-screen relative  flex w-full flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_60%)]  text-center">
      <div className="pointer-events-none absolute inset-0 mt-12" aria-hidden="true" />
      <BackgroundRippleEffect rows={10} cols={100} cellSize={48} />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_45%,rgba(0,0,0,0.85)_85%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto  flex w-full max-w-4xl flex-col items-center gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">CareerCraft Platform</p>
        <h1 className="text-4xl font-semibold leading-tight text-zinc-50 sm:text-5xl">
          Build your next career move with collaborative planning tools.
        </h1>
        <p className="text-lg text-muted-foreground">
          Log in to continue where you left off or create a workspace to start managing job applications, interviews,
          and networking efforts in one place.
        </p>
      </div>
    </section>
  )
}
