// Production entrypoint for a single Render web service.
//
//   Next.js  → 0.0.0.0:$PORT        (public; Render routes traffic here)
//   Express  → 127.0.0.1:$API_PORT  (private; reached via the /api rewrite)
//
// If either process exits, the other is stopped and this script exits with the
// same code, so Render restarts the whole service instead of leaving it half up.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = process.env.PORT || '3000'
// Must match the API_PORT used at build time: next.config.ts bakes the
// /api rewrite destination into the build.
const API_PORT = process.env.API_PORT || '5000'

if (PORT === API_PORT) {
  console.error(`[start] PORT and API_PORT are both ${PORT}; set API_PORT to a different port.`)
  process.exit(1)
}

const env = { ...process.env, API_PORT, NODE_ENV: 'production' }

const children = [
  spawn(process.execPath, ['server/server.js'], { cwd: root, env, stdio: 'inherit' }),
  spawn('npm', ['run', 'start', '--workspace', 'client', '--', '-H', '0.0.0.0', '-p', PORT], {
    cwd: root,
    env,
    stdio: 'inherit',
  }),
]

let shuttingDown = false

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(code), 5000).unref()
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`[start] ${child.spawnargs.slice(0, 2).join(' ')} exited (${signal || code}); stopping service.`)
    }
    shutdown(code ?? 1)
    if (children.every((c) => c.exitCode !== null || c.signalCode !== null)) process.exit(code ?? 1)
  })
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => shutdown(0))
}

console.log(`[start] web on :${PORT}, api on 127.0.0.1:${API_PORT}`)
