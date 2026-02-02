"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "How does the AI Resume Analysis work?",
    answer: "Our advanced AI scans your resume against industry standards and specific job descriptions. It analyzes key factors like ATS compatibility, keyword matching, content structure, and impact verbs to provide a detailed score and actionable improvements."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption for all uploaded documents. Your resumes remain private and are only used for the analysis you request. We do not share your personal data with third parties."
  },
  {
    question: "Can I practice for specific companies?",
    answer: "Yes! You can customize your mock interviews by specifying the company, role, and even specific interview types (behavioral, technical, etc.). Our AI simulates the unique interview style of top tech companies."
  },
  {
    question: " What formats do you support?",
    answer: "We proficiently support PDF and DOCX formats for resume analysis. For the best results, we verify that text is selectable within your document."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400"
          >
            Everything you need to know about Career Craft.
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              faq={faq} 
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, isOpen, onClick, index }: { faq: any, isOpen: boolean, onClick: () => void, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <div 
        onClick={onClick}
        className={`
          group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
          ${isOpen 
            ? "bg-white/10 border-indigo-500/50 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]" 
            : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
          }
          backdrop-blur-xl
        `}
      >
        <div className="p-6 flex items-center justify-between gap-4">
          <h3 className={`text-lg font-medium transition-colors ${isOpen ? "text-white" : "text-gray-200"}`}>
            {faq.question}
          </h3>
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300
            ${isOpen 
              ? "bg-indigo-500 border-indigo-500 rotate-180" 
              : "border-white/20 group-hover:border-white/40"
            }
          `}>
            {isOpen ? (
              <Minus className="w-4 h-4 text-white" />
            ) : (
              <Plus className="w-4 h-4 text-white" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-6 pb-6 text-gray-400 leading-relaxed">
                {faq.answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
