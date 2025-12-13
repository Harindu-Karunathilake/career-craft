import Link from "next/link"

import { contactDetails, emailTemplate, socialLinks } from "@/data/contact"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function ContactSection() {
  return (
    <section id="contact" className="relative isolate w-full bg-black px-6 py-24 text-white sm:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12">
        <div className="space-y-4 text-left md:text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Contact us</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            We'd love to hear how we can support your next career chapter.
          </h2>
          <p className="text-base text-zinc-300 md:mx-auto md:max-w-3xl">
            Reach out for platform questions, partnerships, or coaching programs. Prefer socials? Our team watches
            DMs daily.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-white/10 bg-white/5 text-zinc-100 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Talk with a real person</CardTitle>
              <CardDescription className="text-zinc-300">
                Choose the inbox or channel that fits your request. We'll route it to the right teammate fast.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-4">
                {contactDetails.map((detail) => (
                  <li key={detail.label} className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
                      {detail.label}
                    </p>
                    {detail.href ? (
                      <Link
                        href={detail.href}
                        className="text-lg font-medium text-white transition hover:text-primary"
                      >
                        {detail.value}
                      </Link>
                    ) : (
                      <p className="text-lg font-medium text-white">{detail.value}</p>
                    )}
                    {detail.helper ? (
                      <p className="text-sm text-zinc-400">{detail.helper}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Separator className="border-none bg-white/10" decorative />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/80">Socials</p>
                <ul className="mt-4 flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <li key={link.platform}>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/5 text-white hover:border-primary/60 hover:bg-white/10"
                      >
                        <Link href={link.href} target="_blank" rel="noreferrer">
                          {link.platform}
                          <span className="ml-2 text-primary/80">{link.handle}</span>
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 text-zinc-100 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl">Send us an email</CardTitle>
              <CardDescription className="text-zinc-300">
                Drop in the essentials and we'll reply with an actionable plan. Feel free to tweak the template below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full name</Label>
                    <Input id="contact-name" placeholder="Avery Kim" className="bg-black/40 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="avery@startup.com"
                      className="bg-black/40 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-topic">Topic</Label>
                  <Input
                    id="contact-topic"
                    placeholder="Partnership opportunity"
                    className="bg-black/40 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    
                    className="min-h-[220px] bg-black/40 text-white"
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" className="w-full sm:w-auto">
                    Send message
                  </Button>
                  <p className="text-xs text-zinc-400">Average first response time: under 12 hours.</p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
