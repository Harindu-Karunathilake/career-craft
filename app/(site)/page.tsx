import { WhyChooseUsSection } from "@/components/why-choose-us"
import { ContactSection } from "@/components/contact-section"
import { HeroSection } from "@/components/home/hero"
import { FAQSection } from "@/components/home/faq-section"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black font-sans">
      <HeroSection />
      <WhyChooseUsSection />
      <FAQSection />
      <ContactSection />
    </div>
  )
}
