const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

let cachedEnv

function loadEnv() {
  if (cachedEnv) {
    return cachedEnv
  }

  const envPath = path.resolve(__dirname, '../../.env')

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }

  cachedEnv = {
    // API_PORT is set when Express runs behind Next.js in the same service
    // (Next owns the public $PORT); otherwise fall back to PORT for local dev.
    port: Number(process.env.API_PORT || process.env.PORT || 5000),
    // Internal mode: only reachable from the Next.js process on this machine.
    host: process.env.API_PORT ? '127.0.0.1' : undefined,
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    // Render sets RENDER_EXTERNAL_URL to the service's public URL, so the
    // site's own origin is always allowed without extra configuration.
    clientOrigins: [process.env.CLIENT_ORIGIN, process.env.RENDER_EXTERNAL_URL]
      .join(',')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
    adminEmails: (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  }

  return cachedEnv
}

module.exports = {
  loadEnv,
}
