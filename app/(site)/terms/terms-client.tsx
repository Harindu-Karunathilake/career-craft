"use client"

import { motion } from "framer-motion"

export function TermsAndConditionsClient() {
  return (
    <main className="relative min-h-screen bg-black text-zinc-400 font-sans py-24 px-6 md:py-32">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl mx-auto space-y-12"
      >
        <div className="space-y-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Terms and Conditions</h1>
          <p className="text-zinc-500">Last updated: April 24, 2026</p>
        </div>

        <div className="space-y-8 text-lg leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using CareerCraft, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. User Accounts</h2>
            <p>
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. Platform Services</h2>
            <p>
              CareerCraft provides AI-powered interview coaching, resume analysis, and course-based learning. While we strive for maximum accuracy, AI-generated feedback is for educational purposes only and does not guarantee job placement or specific career outcomes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. Tutor & Course Content</h2>
            <p>
              Tutors are responsible for the content they publish. CareerCraft reserves the right to remove any content that violates our community standards or is reported by users. Payments for courses are processed via PayHere and are subject to their terms of service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of CareerCraft and its licensors. User-uploaded content (resumes, code) remains the intellectual property of the user.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Limitation of Liability</h2>
            <p>
              In no event shall CareerCraft, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of Sri Lanka, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">8. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>
        </div>
      </motion.div>
    </main>
  )
}
