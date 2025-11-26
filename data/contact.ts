export type ContactDetail = {
  label: string
  value: string
  helper?: string
  href?: string
}

export type SocialLink = {
  platform: string
  handle: string
  href: string
}

export const contactDetails: ContactDetail[] = [
  {
    label: "General inquiries",
    value: "hello@careercraft.io",
    helper: "We reply within one business day.",
    href: "mailto:hello@careercraft.io",
  },
  {
    label: "Partnerships",
    value: "partners@careercraft.io",
    helper: "For collaborations, events, and talent programs.",
    href: "mailto:partners@careercraft.io",
  },
  {
    label: "HQ",
    value: "44 Battery St, San Francisco, CA",
    helper: "Remote-first team across 8 time zones.",
  },
]

export const socialLinks: SocialLink[] = [
  {
    platform: "LinkedIn",
    handle: "@careercraft",
    href: "https://www.linkedin.com/company/careercraft",
  },
  {
    platform: "Twitter",
    handle: "@careercraft",
    href: "https://twitter.com/careercraft",
  },
  {
    platform: "YouTube",
    handle: "@careercraft",
    href: "https://www.youtube.com/@careercraft",
  },
]

export const emailTemplate = `Hi CareerCraft Team,

I'm reaching out because _____.

Context:
- Role or company:
- Timeline:
- What I need help with:

Looking forward to hearing from you!

Thanks,
[Your Name]
`