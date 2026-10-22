'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Star,
} from 'lucide-react'
import { FaGithub } from 'react-icons/fa'

type Props = {
  title: string
  description: string
  index: number
  id?: string
  image?: string
  live_url?: string
  github_url?: string
  technologies?: string[]
  featured?: boolean
}

export default function PortfolioCard({
  title,
  description,
  index,
  id,
  image,
  live_url,
  github_url,
  technologies = [],
  featured = false,
}: Props) {
  // Remember which src failed, so a new image URL gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = !image || failedSrc === image
  const chips = technologies.filter(Boolean).slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.06,
      }}
      whileHover={{ y: -4 }}
      className="group relative rounded-[26px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl flex flex-col min-h-[270px]"
    >
      <div className="w-full h-36 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] mb-3 relative">
        {featured && (
          <span className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-amber-300/25 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-200 backdrop-blur-md">
            <Star size={10} className="fill-amber-300 text-amber-300" /> Featured
          </span>
        )}
        {!failed ? (
          <img
            src={image}
            alt={`${title} preview`}
            loading="lazy"
            onError={() => setFailedSrc(image)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-900/40 via-violet-950/30 to-cyan-950/40 p-4">
            {/* Ambient geometric glows */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-600/10 rounded-full blur-xl pointer-events-none" />
            
            {/* Clean cybertech grid overlay */}
            <div 
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
              className="absolute inset-0 opacity-40 pointer-events-none"
            />
            
            {/* Tech project abstract center element */}
            <div className="relative flex flex-col items-center justify-center z-10 select-none scale-90 group-hover:scale-95 transition-transform duration-500">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/5 mb-1.5 backdrop-blur-md">
                <span className="font-mono text-base font-bold text-violet-300 tracking-wider">
                  {title.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-400/60 font-semibold">
                Preview coming soon
              </span>
            </div>
          </div>
        )}
      </div>

      <h3 className="text-[17px] font-semibold mb-2 leading-snug break-words">
        {title}
      </h3>

      {description ? (
        <p className="text-[13px] text-white/65 leading-relaxed line-clamp-3">
          {description}
        </p>
      ) : (
        <p className="text-[13px] italic text-white/35">Details coming soon.</p>
      )}

      {chips.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tech stack">
          {chips.map((tech) => (
            <li key={tech} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-white/60">
              {tech}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {live_url && (
            <a
              href={live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-white/75 hover:text-white transition"
            >
              Live <ArrowUpRight size={14} aria-hidden="true" />
              <span className="sr-only">demo of {title} (opens in new tab)</span>
            </a>
          )}
          {github_url && (
            <a
              href={github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[13px] text-white/75 hover:text-white transition"
            >
              <FaGithub size={14} aria-hidden="true" /> Code
              <span className="sr-only">for {title} on GitHub (opens in new tab)</span>
            </a>
          )}
        </div>

        {id && (
          <Link
            href={`/portfolio/${id}`}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 text-[13px]"
            aria-label={`Details about ${title}`}
          >
            Details
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        )}
      </div>
    </motion.div>
  )
}