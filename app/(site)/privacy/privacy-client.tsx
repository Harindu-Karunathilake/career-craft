"use client"

import { motion } from "framer-motion"

export function PrivacyPolicyClient() {
  return (
    <main className="relative min-h-screen bg-black text-zinc-400 font-sans py-24 px-6 md:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl mx-auto space-y-12"
      >
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Privacy Policy</h1>
          <p className="text-zinc-500">Last updated: April 24, 2026</p>
        </div>

        <div className="space-y-8 text-lg leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
            <p>
              At CareerCraft, we respect your privacy and are committed to protecting your personal data. This Privacy Policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-200">Identity Data:</strong> Includes first name, last name, username or similar identifier.</li>
              <li><strong className="text-zinc-200">Contact Data:</strong> Includes email address and telephone numbers.</li>
              <li><strong className="text-zinc-200">Technical Data:</strong> Includes internet protocol (IP) address, your login data, browser type and version.</li>
              <li><strong className="text-zinc-200">Career Data:</strong> Includes resumes (PDF/DOCX), interview transcripts, and code submissions.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide AI-powered interview feedback and resume analysis.</li>
              <li>To manage your account and provide customer support.</li>
              <li>To personalize your experience with job recommendations.</li>
              <li>To process payments via our third-party provider (PayHere).</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. AI Processing</h2>
            <p>
              CareerCraft uses artificial intelligence (Google Gemini) to analyze your resumes and interview transcripts. This data is processed securely and is not used to train global AI models without your explicit consent. Your data remains your property.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We use Firebase's enterprise-grade security and encryption for all data storage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Your Legal Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing of your personal data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us via our community dashboard or at support@careercraft.com.
            </p>
          </section>
        </div>
      </motion.div>
    </main>
  )
}
