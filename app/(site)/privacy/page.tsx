import type { Metadata } from "next"
import { PrivacyPolicyClient } from "@/app/(site)/privacy/privacy-client"

export const metadata: Metadata = {
  title: "Privacy Policy | CareerCraft",
  description: "Learn how CareerCraft protects your personal data, resume information, and AI interview transcripts.",
  openGraph: {
    title: "Privacy Policy | CareerCraft",
    description: "Your privacy is our priority. Discover our data protection standards.",
    images: ["/og-privacy.png"], // Placeholder if they have one
  },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}
