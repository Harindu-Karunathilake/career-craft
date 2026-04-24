import type { Metadata } from "next"
import { TermsAndConditionsClient } from "@/app/(site)/terms/terms-client"

export const metadata: Metadata = {
  title: "Terms and Conditions | CareerCraft",
  description: "Read the platform usage rules, tutor responsibilities, and legal agreements for using CareerCraft.",
  openGraph: {
    title: "Terms and Conditions | CareerCraft",
    description: "Our platform rules and legal agreements.",
    images: ["/og-terms.png"],
  },
}

export default function TermsAndConditionsPage() {
  return <TermsAndConditionsClient />
}
