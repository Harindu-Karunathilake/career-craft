"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"

import { contactDetails, socialLinks } from "@/data/contact"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle2 } from "lucide-react"

export function ContactSection() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      topic: formData.get("topic"),
      message: formData.get("message"),
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Something went wrong. Please try again.")

      setSuccess(true)
      // Reset form
      form.reset()
    } catch {
      setError("Failed to send message. Please try again later.")
    } finally {
      setLoading(false)
      // Reset success state after 5 seconds
      if (!error) {
          setTimeout(() => setSuccess(false), 5000)
      }
    }
  }

  return (
    <section id="contact" className="relative isolate w-full px-6 py-24 text-white sm:px-10 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.15),transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4 text-left md:text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-400">Contact us</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            We&apos;d love to hear how we can support your next career chapter.
          </h2>
          <p className="text-base text-zinc-400 md:mx-auto md:max-w-3xl">
            Reach out for platform questions, partnerships, or coaching programs. Prefer socials? Our team watches
            DMs daily.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full border-white/10 bg-white/5 text-zinc-100 backdrop-blur-md transition-colors hover:bg-white/10">
              <CardHeader>
                <CardTitle className="text-2xl">Talk with a real person</CardTitle>
                <CardDescription className="text-zinc-300">
                  Choose the inbox or channel that fits your request. We&apos;ll route it to the right teammate fast.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {contactDetails.map((detail) => (
                    <li key={detail.label} className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-400/80">
                        {detail.label}
                      </p>
                      {detail.href ? (
                        <Link
                          href={detail.href}
                          className="text-lg font-medium text-white transition hover:text-indigo-400"
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
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400/80">Socials</p>
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {socialLinks.map((link) => (
                      <li key={link.platform}>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 text-white hover:border-indigo-500/50 hover:bg-white/10"
                        >
                          <Link href={link.href} target="_blank" rel="noreferrer">
                            {link.platform}
                            <span className="ml-2 text-indigo-400/80">{link.handle}</span>
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="h-full border-white/10 bg-white/5 text-zinc-100 backdrop-blur-md transition-colors hover:bg-white/10">
              <CardHeader>
                <CardTitle className="text-2xl">Send us an email</CardTitle>
                <CardDescription className="text-zinc-300">
                  Drop in the essentials and we&apos;ll reply with an actionable plan. Feel free to tweak the template below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Full name</Label>
                      <Input name="name" id="contact-name" placeholder="Avery Kim" required className="bg-black/40 text-white border-white/10 focus:border-indigo-500/50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        name="email"
                        id="contact-email"
                        type="email"
                        required
                        placeholder="avery@startup.com"
                        className="bg-black/40 text-white border-white/10 focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-topic">Topic</Label>
                    <Input
                      name="topic"
                      id="contact-topic"
                      required
                      placeholder="Partnership opportunity"
                      className="bg-black/40 text-white border-white/10 focus:border-indigo-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message</Label>
                    <Textarea
                      name="message"
                      id="contact-message"
                      required
                      className="min-h-[220px] bg-black/40 text-white border-white/10 focus:border-indigo-500/50"
                    />
                  </div>
                  
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  {success && (
                      <div className="flex items-center gap-2 text-sm text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Message sent successfully! We&apos;ll be in touch.</span>
                      </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send message"}
                    </Button>
                    <p className="text-xs text-zinc-400">Average first response time: under 12 hours.</p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
