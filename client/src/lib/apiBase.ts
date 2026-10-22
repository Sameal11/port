const LOCAL_HOSTS = ['localhost', '127.0.0.1']

/** Where the Express API listens, as seen from the Next.js server process. */
export function getInternalApiOrigin() {
  return (
    process.env.INTERNAL_API_URL ||
    `http://127.0.0.1:${process.env.API_PORT || 5000}`
  ).replace(/\/$/, '')
}

/**
 * Base URL of the Express API (including `/api`, no trailing slash).
 *
 * - Not configured (production on Render): the browser calls same-origin
 *   `/api`, which next.config.ts rewrites to the internal Express server;
 *   server-side code calls Express directly.
 * - Configured as localhost but the page was opened from another host (e.g. a
 *   phone on the LAN via http://192.168.x.x:3000): "localhost" would mean the
 *   visitor's own device, so the page's host is used instead.
 */
export function getApiBaseUrl() {
  const configured = (process.env.NEXT_PUBLIC_PORTFOLIO_API_BASE_URL || '').replace(/\/$/, '')
  const isServer = typeof window === 'undefined'

  if (!configured || configured.startsWith('/')) {
    return isServer ? `${getInternalApiOrigin()}/api` : configured || '/api'
  }

  if (isServer) return configured

  try {
    const url = new URL(configured)
    const pageHost = window.location.hostname
    if (LOCAL_HOSTS.includes(url.hostname) && !LOCAL_HOSTS.includes(pageHost)) {
      // A deployed build must never point visitors at "localhost" (their own
      // machine). This happens when a local .env value is copied to the host's
      // settings, so fall back to the site's own /api instead of failing.
      if (process.env.NODE_ENV === 'production') return '/api'
      url.hostname = pageHost
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    // Malformed value: use it as-is.
  }

  return configured
}
