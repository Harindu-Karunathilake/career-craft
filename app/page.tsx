import { WhyChooseUsSection } from "@/components/why-choose-us";
import { ContactSection } from "@/components/contact-section";
import { HeroSection } from "@/components/home/hero";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black px-6 py-5 font-sans">
      <HeroSection />
      <WhyChooseUsSection />
      <ContactSection />
    </div>
  );
}
