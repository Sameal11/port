'use client'

import { FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, ArrowUpRight, Copy, Check, Mail, MapPin } from 'lucide-react'
import {
  FaLinkedinIn,
  FaInstagram,
  FaGithub,
  FaYoutube,
  FaTiktok,
  FaGlobe,
  FaBehance,
  FaDribbble,
  FaXTwitter,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import type { PortfolioSocialLink } from '@/lib/portfolioService'
import { trackEvent } from '@/utils/analytics'

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Props = {
  socialLinks: PortfolioSocialLink[]
  loading: boolean
  email?: string | null
  location?: string | null
}

const platformIcons: Record<string, IconType> = {
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  github: FaGithub,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  behance: FaBehance,
  dribbble: FaDribbble,
  twitter: FaXTwitter,
  x: FaXTwitter,
}

const platformNames: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  x: 'X',
}

function platformName(platform: string) {
  const key = platform.toLowerCase()
  return platformNames[key] || platform.charAt(0).toUpperCase() + platform.slice(1)
}

/** "https://in.linkedin.com/in/some-name-123/" → "in/some-name-123" */
function shortUrl(url: string) {
  try {
    const { hostname, pathname } = new URL(url)
    const path = pathname.replace(/\/$/, '').replace(/^\//, '')
    return path || hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const inputClass =
  'w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3.5 text-[15px] text-white placeholder-white/30 outline-none transition focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20'

export default function ContactForm({ socialLinks, loading, email, location }: Props) {
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'opened' | 'invalid'>('idle')
  const [copied, setCopied] = useState(false)

  const links = socialLinks.filter((item) => item.url)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !message.trim() || !email) {
      setStatus('invalid')
      return
    }
    const subject = `Portfolio enquiry from ${name.trim()}`
    const body = `${message.trim()}\n\n— ${name.trim()}${from.trim() ? ` (${from.trim()})` : ''}`
    trackEvent('contact_submit', { via: 'mailto' })
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setStatus('opened')
  }

  async function copyEmail() {
    if (!email) return
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
      {/* Direct contact */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: smoothEase }}
        className="flex flex-col rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8"
      >
        <h3 className="text-2xl font-bold md:text-3xl">Let&apos;s talk</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Open to internships and collaborations. The fastest way to reach me is email. I usually reply within a day or two.
        </p>

        {email && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Email</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a href={`mailto:${email}`} className="mr-auto break-all text-[15px] text-white hover:text-violet-200">
                {email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="flex items-center gap-1.5 rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {location && (
          <p className="mt-4 flex items-center gap-2 text-sm text-white/55">
            <MapPin size={14} aria-hidden="true" /> {location}
          </p>
        )}

        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Elsewhere</p>
          {loading ? (
            <div className="mt-3 space-y-2" aria-busy="true">
              <div className="h-14 animate-pulse rounded-2xl bg-white/[0.04]" />
              <div className="h-14 animate-pulse rounded-2xl bg-white/[0.04]" />
            </div>
          ) : links.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">No profiles linked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {links.map((item) => {
                const Icon = platformIcons[item.platform.toLowerCase()] || FaGlobe
                return (
                  <li key={item.id}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 transition hover:border-white/25 hover:bg-white/[0.04]"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                        <Icon aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{platformName(item.platform)}</span>
                        <span className="block truncate text-xs text-white/40">{item.username || shortUrl(item.url)}</span>
                      </span>
                      <ArrowUpRight size={15} className="text-white/35 transition group-hover:text-white" aria-hidden="true" />
                      <span className="sr-only">(opens in new tab)</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </motion.div>

      {/* Message form */}
      <motion.form
        onSubmit={handleSubmit}
        noValidate
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, delay: 0.08, ease: smoothEase }}
        className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-8"
        aria-labelledby="contact-form-title"
      >
        <div>
          <h3 id="contact-form-title" className="text-xl font-bold md:text-2xl">Send a message</h3>
          <p className="mt-2 text-sm text-white/50">
            This opens your email app with the message ready to send.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              aria-invalid={status === 'invalid' && !name.trim()}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">
              Company or email <span className="text-white/35">(optional)</span>
            </span>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              autoComplete="organization"
              className={inputClass}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-white/70">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            required
            aria-invalid={status === 'invalid' && !message.trim()}
            placeholder="What are you working on?"
            className={`${inputClass} resize-y`}
          />
        </label>

        <div aria-live="polite" className="min-h-[1.25rem] text-sm">
          {status === 'invalid' && !email && (
            <p className="text-red-300">Email isn&apos;t set up yet. Please use one of the links instead.</p>
          )}
          {status === 'invalid' && email && (
            <p className="text-red-300">Please add your name and a message.</p>
          )}
          {status === 'opened' && (
            <p className="flex items-center gap-2 text-emerald-300">
              <Mail size={14} aria-hidden="true" /> Your email app should open now. If it doesn&apos;t, copy the address on the left.
            </p>
          )}
        </div>

        <button
          type="submit"
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 py-3.5 font-medium text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110 active:scale-[0.99]"
        >
          <Send size={16} aria-hidden="true" />
          Send message
        </button>
      </motion.form>
    </div>
  )
}
