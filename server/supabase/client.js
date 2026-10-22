if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class {};
}

const { createClient } = require('@supabase/supabase-js')
const { loadEnv } = require('../config/env')

let supabaseClient

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const env = loadEnv()

  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in root .env'
    )
  }

  supabaseClient = createClient(
    env.supabaseUrl,
    env.supabaseServiceRoleKey
  )

  return supabaseClient
}

module.exports = {
  getSupabaseClient,
}
