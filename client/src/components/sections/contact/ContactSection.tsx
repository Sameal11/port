'use client'

import { motion } from 'framer-motion'
import ContactForm from './ContactForm'
import type { PortfolioSocialLink } from '@/lib/portfolioService'

const smoothEase: [number, number, number, number] = [
  0.22,
  1,
  0.36,
  1,
]

type Props = {
  socialLinks: PortfolioSocialLink[]
  fullName?: string
  email?: string | null
  location?: string | null
  loading: boolean
}

export default function ContactSection({
  socialLinks,
  fullName,
  email,
  location,
  loading,
}: Props) {
  return (
    <section
      id="contact"
      className="w-full max-w-[1500px] mx-auto 
      px-5 sm:px-6 md:px-10 lg:px-20
      pt-20 sm:pt-24 lg:pt-28 
      pb-24 sm:pb-28 lg:pb-36 
      text-white"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          ease: smoothEase,
        }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center mb-12 sm:mb-14 lg:mb-16"
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
          Contact
        </h2>

        <p className="text-white/60 text-sm sm:text-base max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
          Have a project, a role, or a workflow that feels harder than it should? Let&apos;s talk.
        </p>
      </motion.div>

      <ContactForm
        socialLinks={socialLinks}
        loading={loading}
        email={email}
        location={location}
      />

      <div className="mt-20 text-center text-xs text-white/35">
        © {new Date().getFullYear()} {fullName || 'portfolio'} - All rights reserved.
      </div>
    </section>
  )
}
