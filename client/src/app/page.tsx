'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import AnimatedBackground from '@/components/AnimatedBackground'
import Navbar from '@/components/ui/Navbar'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import PortfolioShowcase from '@/components/sections/PortfolioShowcase'
import ContactSection from '@/components/sections/contact/ContactSection'
import WelcomeScreen from '@/components/WelcomeScreen'

import { hasPlayedIntro, setIntroPlayed } from '@/lib/introState'
import usePortfolio from '@/hooks/usePortfolio'
import { trackEvent } from '@/utils/analytics'

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false)
  const portfolio = usePortfolio()

  useEffect(() => {
    // Track page view
    trackEvent('page_view', { page: '/' })
  }, [])

  useEffect(() => {
    const currentHash = window.location.hash
    const pathname = window.location.pathname

    // kalau balik dari detail ke portfolio
    if (currentHash === '#portfolio') {
      return
    }

    const navEntries = performance.getEntriesByType('navigation')
    const navigationType =
      navEntries.length > 0
        ? (navEntries[0] as PerformanceNavigationTiming).type
        : null

    const isReload = navigationType === 'reload'

    // hanya homepage yang reset intro
    if (isReload && pathname === '/') {
      sessionStorage.removeItem('introPlayed')
      sessionStorage.removeItem('heroPlayed')

      if (window.location.hash) {
        history.replaceState(null, '', '/')
      }

      window.scrollTo({
        top: 0,
        behavior: 'instant',
      })
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) setIntroPlayed()

    if (!hasPlayedIntro()) {
      const openFrame = requestAnimationFrame(() => {
        setShowWelcome(true)
      })

      const timer = setTimeout(() => {
        setShowWelcome(false)
        setIntroPlayed()
      }, 1400)

      return () => {
        cancelAnimationFrame(openFrame)
        clearTimeout(timer)
      }
    }

    const closeFrame = requestAnimationFrame(() => {
      setShowWelcome(false)
    })

    return () => cancelAnimationFrame(closeFrame)
  }, [])

  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <Navbar brandName={portfolio.personalInfo?.brand_name} />
        <Hero
          personalInfo={portfolio.personalInfo}
          skills={portfolio.skills}
          loading={portfolio.loading}
          resumeLinks={portfolio.resumeLinks}
        />
        <About
          about={portfolio.about}
          projectsCount={portfolio.projects.length}
          certificationsCount={portfolio.certifications.length}
          achievementsCount={portfolio.achievements.length}
          experienceCount={portfolio.experience.length}
          skillsCount={portfolio.skills.length}
          resumeLinks={portfolio.resumeLinks}
          loading={portfolio.loading}
        />
        <PortfolioShowcase
          projects={portfolio.projects}
          certifications={portfolio.certifications}
          skills={portfolio.skills}
          loading={portfolio.loading}
          error={portfolio.error}
        />
        <ContactSection
          socialLinks={portfolio.socialLinks}
          fullName={portfolio.personalInfo?.full_name}
          email={portfolio.personalInfo?.email}
          location={portfolio.personalInfo?.location}
          loading={portfolio.loading}
        />
      </div>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{
              duration: 0.8,
              ease: [0.76, 0, 0.24, 1],
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
            }}
          >
            <WelcomeScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
