// postinstall: download Chrome for resume PDFs.
//
// Optional for the site, so it must never fail the install/deploy. Puppeteer's
// own installer can exit "successfully" with a half-extracted Chrome: its zip
// library (extract-zip/yauzl) stops early on recent Node versions. A build
// cache then preserves that broken folder, and every later build fails with
// "the browser folder exists but the executable is missing". So:
//   1. run the normal install;
//   2. check that the Chrome executable really exists;
//   3. if not, extract the downloaded zip with `unzip` (or Python) instead;
//   4. still broken → clear the cache, download again, repeat 2–3;
//   5. still broken → warn and continue; only PDF export is affected.
const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const log = (msg) => console.log(`[install-browser] ${msg}`)

if (/^(1|true)$/i.test(process.env.PUPPETEER_SKIP_DOWNLOAD || '')) {
  log('PUPPETEER_SKIP_DOWNLOAD is set; skipping Chrome download.')
  process.exit(0)
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', env: process.env })
  return !result.error && result.status === 0
}

function expectedExecutable() {
  try {
    return require('puppeteer').executablePath()
  } catch {
    return null
  }
}

function chromeCacheDir() {
  try {
    const { getConfiguration } = require('puppeteer/lib/cjs/puppeteer/getConfiguration.js')
    return path.join(getConfiguration().cacheDirectory, 'chrome')
  } catch {
    return path.join(
      process.env.PUPPETEER_CACHE_DIR || path.join(require('os').homedir(), '.cache', 'puppeteer'),
      'chrome'
    )
  }
}

const PY_UNZIP = `
import sys, zipfile, os
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(src) as z:
    for info in z.infolist():
        out = z.extract(info, dst)
        mode = (info.external_attr >> 16) & 0o777
        if mode:
            os.chmod(out, mode)
`

/** Re-extract any downloaded-but-unpacked Chrome zips with a reliable tool. */
function repairFromZips() {
  const dir = chromeCacheDir()
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const match = name.match(/^(.+)-chrome-(linux64|linux_arm|mac-x64|mac-arm64|win64|win32)\.zip$/)
    if (!match) continue
    const zip = path.join(dir, name)
    const target = path.join(dir, `${match[2] === 'linux64' ? 'linux' : match[2]}-${match[1]}`)
    log(`Re-extracting ${name} → ${target}`)
    fs.rmSync(target, { recursive: true, force: true })
    fs.mkdirSync(target, { recursive: true })
    const ok =
      run('unzip', ['-q', '-o', zip, '-d', target]) ||
      run('python3', ['-c', PY_UNZIP, zip, target])
    if (ok) fs.rmSync(zip, { force: true })
  }
}

function installed() {
  const exe = expectedExecutable()
  return Boolean(exe && fs.existsSync(exe))
}

function attempt() {
  run('npx', ['--no-install', 'puppeteer', 'browsers', 'install', 'chrome'])
  if (installed()) return true
  repairFromZips()
  return installed()
}

if (attempt()) {
  log(`Chrome ready: ${expectedExecutable()}`)
  process.exit(0)
}

log(`Chrome is incomplete; clearing ${chromeCacheDir()} and downloading again.`)
fs.rmSync(chromeCacheDir(), { recursive: true, force: true })

if (attempt()) {
  log(`Chrome ready: ${expectedExecutable()}`)
  process.exit(0)
}

console.warn(
  '[install-browser] Chrome could not be installed. The site will work, but resume PDF ' +
    'generation will fail until it is. Redeploy with "Clear build cache & deploy" to retry.'
)
process.exit(0)
