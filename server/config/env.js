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
    port: Number(process.env.PORT || 5000),
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    clientOrigins: (process.env.CLIENT_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
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
