if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}
const express = require('express')
const cors = require('cors')
const { loadEnv } = require('./config/env')
const portfolioRoutes = require('./routes/portfolioRoutes')
const adminRoutes = require('./routes/adminRoutes')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const { trackEvent } = require('./services/analyticsService')
const crypto = require('crypto')

const env = loadEnv()
const app = express()

// Behind proxies (Render, the Next.js rewrite) so req.ip / x-forwarded-for are meaningful.
app.set('trust proxy', true)

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (health checks, curl) are always safe.
      if (!origin) return callback(null, true)

      // Fail closed in production: an unconfigured CLIENT_ORIGIN must not
      // silently allow every origin with credentials enabled. Only fall back
      // to permissive behavior outside production (local dev convenience).
      if (env.clientOrigins.length === 0) {
        if (process.env.NODE_ENV === 'production') {
          console.error('[cors] CLIENT_ORIGIN is not configured — denying cross-origin request in production.')
          return callback(new Error('Origin is not allowed by CORS.'))
        }
        return callback(null, true)
      }

      if (env.clientOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Origin is not allowed by CORS.'))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Public portfolio analytics tracking endpoint (no auth required)
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { event_type, event_data = {} } = req.body
    if (!event_type) return res.status(400).json({ error: 'event_type required' })
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
    await trackEvent(event_type, event_data, ipHash)
    res.json({ ok: true })
  } catch (err) {
    // Don't break the user experience for analytics failures
    res.json({ ok: false, error: err.message })
  }
})

// Routes
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(env.port, env.host, () => {
  console.log(`🚀 API listening on ${env.host || 'all interfaces'}:${env.port}`)
})
