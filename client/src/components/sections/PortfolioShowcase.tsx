'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type {
  PortfolioCertification,
  PortfolioProject,
  PortfolioSkill,
} from '@/lib/portfolioService'
import PortfolioCard from './PortfolioCard'
import { PORTFOLIO_TAB_EVENT } from './About'

const smoothEase: [number, number, number, number] = [
  0.22,
  1,
  0.36,
  1,
]

type Props = {
  projects: PortfolioProject[]
  certifications: PortfolioCertification[]
  skills: PortfolioSkill[]
  loading: boolean
  error: string | null
}

export default function PortfolioShowcase({
  projects,
  certifications,
  skills,
  loading,
  error,
}: Props) {
  const [activeTab, setActiveTab] =
    useState('projects')

  const [previewOpen, setPreviewOpen] =
    useState(false)

  const [previewImage, setPreviewImage] =
    useState('')

  const [showAllProjects, setShowAllProjects] =
    useState(false)

  // Featured work leads; the rest keeps the CMS display order.
  const orderedProjects = [...projects].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
  )

  const displayedProjects = showAllProjects
    ? orderedProjects
    : orderedProjects.slice(0, 3)

  // Lets other sections (e.g. the About stat cards) open a specific tab.
  useEffect(() => {
    const onTab = (event: Event) => {
      const tab = (event as CustomEvent<string>).detail
      if (['projects', 'certificates', 'techstack'].includes(tab)) setActiveTab(tab)
    }
    window.addEventListener(PORTFOLIO_TAB_EVENT, onTab)
    return () => window.removeEventListener(PORTFOLIO_TAB_EVENT, onTab)
  }, [])

  return (
    <>
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center px-6"
          >
            <button
              onClick={() => setPreviewOpen(false)}
              className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <X size={18} />
            </button>

            <motion.img
              initial={{
                scale: 0.92,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              exit={{
                scale: 0.92,
                opacity: 0,
              }}
              transition={{ duration: 0.35 }}
              src={previewImage}
              alt="Certificate preview"
              className="max-w-[88vw] max-h-[88vh] rounded-3xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section
        id="portfolio"
        className="w-full max-w-[1450px] mx-auto px-8 md:px-12 lg:px-20 pt-24 pb-24 text-white"
      >
        <motion.div
          initial={{ opacity: 0, y: 45 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-3">
            Portfolio Showcase
          </h2>

          <p className="text-white/55 max-w-xl mx-auto text-sm md:text-base">
            Explore my journey through projects,
            certifications, and technical expertise.
          </p>
        </motion.div>

        <div className="flex justify-center mb-10">
          <div role="tablist" aria-label="Portfolio sections" className="w-full max-w-3xl rounded-full border border-white/10 bg-white/5 p-1.5 sm:p-2 flex gap-1 sm:gap-2 backdrop-blur-xl">
            {[
              'projects',
              'certificates',
              'techstack',
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => {
                  setActiveTab(tab)

                  if (tab !== 'projects') {
                    setShowAllProjects(false)
                  }
                }}
                className={`flex-1 rounded-full py-2.5 sm:py-3 text-[13px] sm:text-sm transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab === 'projects'
                  ? 'Projects'
                  : tab === 'certificates'
                  ? 'Certificates'
                  : 'Tech Stack'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45 }}
          >
            {activeTab === 'projects' && (
              <div className="space-y-8">
                <motion.div
                  layout
                  transition={{
                    layout: {
                      duration: 0.75,
                      ease: smoothEase,
                    },
                  }}
                  className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 px-1"
                >
                  <AnimatePresence mode="popLayout">
                    {!loading &&
                      displayedProjects.map(
                        (item, i) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{
                              opacity: 0,
                              y: 40,
                              scale: 0.96,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              scale: 1,
                            }}
                            exit={{
                              opacity: 0,
                              y: -30,
                              scale: 0.95,
                            }}
                            transition={{
                              duration: 0.55,
                              delay: i * 0.04,
                              ease: smoothEase,
                            }}
                          >
                            <PortfolioCard
                              index={i}
                              title={item.title}
                              description={
                                item.description
                              }
                              image={item.image_url || undefined}
                              live_url={item.live_url || undefined}
                              github_url={item.github_url || undefined}
                              technologies={item.technologies}
                              featured={Boolean(item.featured)}
                              id={item.id}
                            />
                          </motion.div>
                        )
                      )}
                  </AnimatePresence>
                </motion.div>

                {loading && (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 px-1" aria-busy="true" aria-label="Loading projects">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 animate-pulse">
                        <div className="h-44 rounded-2xl bg-white/[0.05]" />
                        <div className="mt-4 h-4 w-2/3 rounded bg-white/[0.06]" />
                        <div className="mt-3 h-3 w-full rounded bg-white/[0.04]" />
                        <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.04]" />
                      </div>
                    ))}
                  </div>
                )}

                {!loading &&
                  projects.length === 0 && (
                    <div className="text-center text-sm text-white/55">
                      No projects available yet.
                    </div>
                  )}

                {!loading &&
                  projects.length > 3 && (
                    <motion.div
                      layout
                      transition={{
                        duration: 0.6,
                        ease: smoothEase,
                      }}
                      className="flex justify-center"
                    >
                      <motion.button
                        layout
                        whileHover={{
                          scale: 1.04,
                        }}
                        whileTap={{
                          scale: 0.97,
                        }}
                        onClick={() =>
                          setShowAllProjects(
                            !showAllProjects
                          )
                        }
                        className="px-6 py-3 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-xl text-sm text-white/75 hover:text-white transition flex items-center gap-2"
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={
                              showAllProjects
                                ? 'less'
                                : 'more'
                            }
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              y: -8,
                            }}
                            transition={{
                              duration: 0.25,
                            }}
                            className="flex items-center gap-2"
                          >
                            {showAllProjects ? (
                              <>
                                <ChevronUp
                                  size={16}
                                />
                                Show fewer
                              </>
                            ) : (
                              <>
                                <ChevronDown
                                  size={16}
                                />
                                Show all {projects.length} projects
                              </>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </motion.button>
                    </motion.div>
                  )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 px-1">
                {!loading &&
                  certifications.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{
                        opacity: 0,
                        y: 25,
                        scale: 0.96,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.04,
                      }}
                      whileHover={{ y: -4 }}
                      onClick={() => {
                        if (!item.image_url) {
                          return
                        }

                        setPreviewImage(
                          item.image_url
                        )
                        setPreviewOpen(true)
                      }}
                      className="group cursor-pointer rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                    >
                      <div className="rounded-2xl overflow-hidden border border-white/10 h-56">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/[0.03]" />
                        )}
                      </div>

                      <h3 className="mt-4 text-[15px] font-semibold text-center text-white/90">
                        {item.title}
                      </h3>
                    </motion.div>
                  ))}

                {!loading &&
                  certifications.length === 0 && (
                    <div className="col-span-full text-center text-sm text-white/55">
                      No certifications available yet.
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'techstack' && (
              <div className="min-h-[360px] flex justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 max-w-5xl w-full">
                  {!loading &&
                    skills.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{
                          opacity: 0,
                          scale: 0.9,
                          y: 20,
                        }}
                        whileInView={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.04,
                        }}
                        whileHover={{
                          y: -5,
                          scale: 1.04,
                        }}
                        className="group rounded-[24px] border border-white/10 bg-white/[0.04] backdrop-blur-xl flex flex-col items-center justify-center gap-3 h-[125px] w-[125px] mx-auto"
                      >
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-[70px] h-[70px] rounded-full bg-white/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-500" />

                          {item.logo_url ? (
                            <img
                              src={item.logo_url}
                              alt={item.name}
                              className="relative z-10 w-[56px] h-[56px] object-contain"
                            />
                          ) : (
                            <div className="relative z-10 w-[56px] h-[56px] rounded-2xl bg-white/10" />
                          )}
                        </div>

                        <p className="text-[11px] text-white/80 text-center leading-tight px-2 line-clamp-1">
                          {item.name}
                        </p>
                      </motion.div>
                    ))}

                  {!loading &&
                    skills.length === 0 && (
                      <div className="col-span-full text-center text-sm text-white/55">
                        No skills available yet.
                      </div>
                    )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </>
  )
}
