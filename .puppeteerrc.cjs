// Puppeteer (resume PDFs) looks for this file from the working directory upward.
// On Render only /opt/render/project/src survives from build to runtime, so keep
// the downloaded Chrome inside the project there. Locally the default
// (~/.cache/puppeteer) is kept. PUPPETEER_CACHE_DIR, if set, still wins.
const path = require('path')

module.exports = {
  cacheDirectory: process.env.RENDER ? path.join(__dirname, '.cache', 'puppeteer') : undefined,
}
