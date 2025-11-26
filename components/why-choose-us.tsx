import { whyChooseUsCards } from "@/data/why-choose-us"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function WhyChooseUsSection() {
  return (
    <section id="why-choose-us" className="mt-24 relative isolate w-full overflow-hidden py-24">
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 h-[120%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(99,122,241,0.25),transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 text-left sm:px-8 lg:px-0">
        <div className="space-y-4 text-left md:text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Why choose us</p>
          <h2 className="text-3xl font-semibold text-zinc-50 sm:text-4xl">
            Designed for ambitious job seekers and teams who support them.
          </h2>
          <p className="text-base text-muted-foreground md:mx-auto md:max-w-3xl">
            Bring your interviews, networking, and application workflow together. Every playbook, reminder, and insight stays
            synced so you can focus on telling your story.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {whyChooseUsCards.map((card) => (
            <Card key={card.title} className="border-white/10 bg-white/5 backdrop-blur">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl text-zinc-50">{card.title}</CardTitle>
                <CardDescription className="text-sm text-zinc-300">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <Separator className="border-none bg-white/10" decorative />
              <CardContent className="space-y-3 py-4">
                <ul className="text-sm text-zinc-200">
                  {card.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-primary/90">{card.metric}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
