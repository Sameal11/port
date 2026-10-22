import type { NextConfig } from 'next'
import fs from 'fs'
import os from 'os'
import path from 'path'

function loadRootEnv() {
  const envPath = path.resolve(__dirname, '../.env')

  if (!fs.existsSync(envPath)) {
    return {}
  }

  const raw = fs.readFileSync(envPath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const env: Record<string, string> = {}

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    env[key] = value
  }

  return env
}

const rootEnv = loadRootEnv()

// Next.js dev refuses to serve its JS to hosts other than localhost unless they
// are listed here, so opening the site via a LAN IP rendered an empty shell.
// Allow every IPv4 address of this machine, plus any extras in DEV_ORIGINS.
function getLanOrigins() {
  const lanIps = Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface!.address)
  const extra = (process.env.DEV_ORIGINS || rootEnv.DEV_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return [...new Set([...lanIps, ...extra])]
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getLanOrigins(),
  // Keep the dev-only Next.js badge clear of the admin sidebar's Sign out button.
  devIndicators: { position: 'bottom-right' },
  // The repository is an npm workspace. Setting this explicitly prevents
  // Turbopack from guessing between the root and client lockfiles.
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  env: {
    NEXT_PUBLIC_PORTFOLIO_API_BASE_URL:
      process.env.NEXT_PUBLIC_PORTFOLIO_API_BASE_URL ||
      rootEnv.NEXT_PUBLIC_PORTFOLIO_API_BASE_URL ||
      '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

export default nextConfig
