const { getSupabaseClient } = require('../supabase/client')
const { loadEnv } = require('../config/env')

let warnedMissingAdminEmails = false

/**
 * Middleware: verify Supabase JWT from Authorization: Bearer <token>
 * The server uses the service role key so it can validate user JWTs via auth.getUser()
 */
async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token.' })
  }

  try {
    const supabase = getSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token.' })
    }

    const { adminEmails } = loadEnv()
    // Fail closed in production: with no admin allow-list, refuse everyone
    // rather than treating every authenticated Supabase user as an admin.
    // Locally, any signed-in user is allowed so the CMS works out of the box.
    if (adminEmails.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[authMiddleware] ADMIN_EMAILS is not configured — denying admin access.')
        return res.status(403).json({ error: 'Admin access is not configured on this server. Set ADMIN_EMAILS.' })
      }
      if (!warnedMissingAdminEmails) {
        console.warn('[authMiddleware] ADMIN_EMAILS is not set — allowing any signed-in user (development only).')
        warnedMissingAdminEmails = true
      }
    } else if (!adminEmails.includes(user.email?.toLowerCase())) {
      return res.status(403).json({ error: 'This user is not an administrator.' })
    }

    req.adminUser = user
    next()
  } catch (err) {
    console.error('[authMiddleware]', err)
    return res.status(500).json({ error: 'Authentication error.' })
  }
}

module.exports = { requireAdmin }
