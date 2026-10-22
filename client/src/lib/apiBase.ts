const LOCAL_HOSTS = ['localhost', '127.0.0.1']

/**
 * Base URL of the Express API (including `/api`, no trailing slash).
 *
 * When the configured URL points at localhost but the page was opened from
 * another host (e.g. a phone on the LAN via http://192.168.x.x:3000),
 * "localhost" would mean the visitor's own device. In that case the API is
 * assumed to run on the same machine that served the page.
 */
export function getApiBaseUrl() {
  const configured = (
    process.env.NEXT_PUBLIC_PORTFOLIO_API_BASE_URL || 'http://localhost:5000/api'
  ).replace(/\/$/, '')

  if (typeof window === 'undefined') return configured

  try {
    const url = new URL(configured)
    const pageHost = window.location.hostname
    if (LOCAL_HOSTS.includes(url.hostname) && !LOCAL_HOSTS.includes(pageHost)) {
      url.hostname = pageHost
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    // Relative or malformed value: use it as-is.
  }

  return configured
}
