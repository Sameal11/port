'use client'

import { useEffect, useState } from 'react'
import {
  fetchPortfolioData,
  type PortfolioData,
} from '@/services/portfolioService'

const emptyPortfolio: PortfolioData = {
  personalInfo: null,
  about: null,
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
  socialLinks: [],
  experience: [],
  education: [],
  resumeLinks: [],
  homepageSections: [],
  theme: null,
}

export default function usePortfolio() {
  const [data, setData] = useState<PortfolioData>(emptyPortfolio)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPortfolio = async () => {
    setLoading(true)
    setError(null)

    try {
      const portfolioData = await fetchPortfolioData()
      setData(portfolioData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load portfolio data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPortfolio()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  return {
    ...data,
    loading,
    error,
    reload: loadPortfolio,
  }
}
