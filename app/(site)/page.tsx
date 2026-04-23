import { WhyChooseUsSection } from "@/components/why-choose-us"
import { ContactSection } from "@/components/contact-section"
import { HeroSection } from "@/components/home/hero"
import { FAQSection } from "@/components/home/faq-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Career Craft | AI-Powered Career Excellence",
  description: "Master your career with AI-driven interview coaching, personalized course pathways, and a community of ambitious professionals.",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <HeroSection />
      <WhyChooseUsSection />
      <FAQSection />
      <ContactSection />
    </div>
  )
}
