const { getSetting } = require('./adminService')
const GITHUB_API = 'https://api.github.com'

/**
 * Fetch repositories from GitHub (public + optionally private via PAT)
 */
async function fetchGithubRepos(pat = null) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Portfolio-CMS-Monolith',
  }
  if (pat) headers['Authorization'] = `Bearer ${pat}`

  // With PAT: fetch authenticated user repos (includes private)
  // Without PAT: fetch only public repos of the configured username
  let url
  if (pat) {
    url = `${GITHUB_API}/user/repos?type=all&sort=updated&per_page=100`
  } else {
    const username = await getSetting('github_username')
    if (!username) throw new Error('GitHub username not configured in settings.')
    url = `${GITHUB_API}/users/${username}/repos?type=public&sort=updated&per_page=100`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`GitHub API error ${res.status}: ${msg}`)
  }

  const repos = await res.json()
  return repos.map(mapRepoToProject)
}

/**
 * Map a GitHub repo object → projects table schema
 */
function mapRepoToProject(repo) {
  return {
    title: repo.name,
    description: repo.description || '',
    github_url: repo.html_url,
    live_url: repo.homepage || null,
    technologies: repo.language ? [repo.language] : [],
    key_features: [],
    image_url: null,
    image_urls: [],        // jsonb — must be array, not string
    featured: false,
    visible: true,
    display_order: 0,
    source: 'github',
    github_repo_id: repo.id,
  }
}

/**
 * Sync GitHub repos into the projects table.
 * Uses a manual fetch-then-insert/update strategy so it does NOT require
 * the unique constraint on github_repo_id to exist in the DB.
 */
async function syncGithubRepos(pat = null) {
  const { getSupabaseClient } = require('../supabase/client')
  const supabase = getSupabaseClient()

  // Get PAT from settings if not provided
  const resolvedPat = pat || (await getSetting('github_pat')) || process.env.GITHUB_PAT || null

  const repos = await fetchGithubRepos(resolvedPat)
  if (repos.length === 0) return { synced: 0, upserted: 0, repos: [] }

  // Fetch all existing github_repo_ids already in the DB
  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('id, github_repo_id, title, description, technologies, live_url')
    .eq('source', 'github')
    .not('github_repo_id', 'is', null)

  if (fetchError) throw fetchError

  const existingMap = new Map((existing || []).map(r => [r.github_repo_id, r]))

  const toInsert = []
  const toUpdate = []

  for (const repo of repos) {
    if (existingMap.has(repo.github_repo_id)) {
      const current = existingMap.get(repo.github_repo_id)
      // Only fill fields that are still empty in the CMS: anything edited there
      // (title, description, stack, live link) must survive a re-sync.
      // featured/visible/display_order are never touched.
      toUpdate.push({
        id: current.id,
        title: current.title?.trim() ? current.title : repo.title,
        description: current.description?.trim() ? current.description : repo.description,
        github_url: repo.github_url,
        live_url: current.live_url || repo.live_url,
        technologies: current.technologies?.length ? current.technologies : repo.technologies,
        updated_at: new Date().toISOString(),
      })
    } else {
      toInsert.push(repo)
    }
  }

  let upsertedCount = 0

  // Insert new repos
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from('projects')
      .insert(toInsert)
      .select('id')
    if (error) throw error
    upsertedCount += data?.length || 0
  }

  // Update existing repos (one by one to avoid needing bulk update)
  for (const update of toUpdate) {
    const { id, ...fields } = update
    const { error } = await supabase
      .from('projects')
      .update(fields)
      .eq('id', id)
    if (error) throw error
    upsertedCount++
  }

  return {
    synced: repos.length,
    upserted: upsertedCount,
    repos: [],
  }
}

function githubHeaders(pat) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Portfolio-CMS-Monolith',
  }
  if (pat) headers.Authorization = `Bearer ${pat}`
  return headers
}

function parseGithubUrl(repoUrl) {
  let url
  try { url = new URL(repoUrl) } catch { throw new Error('Enter a valid GitHub repository URL.') }
  if (url.hostname !== 'github.com') throw new Error('Only github.com repository URLs can be imported.')
  const [owner, repo] = url.pathname.split('/').filter(Boolean)
  if (!owner || !repo) throw new Error('GitHub URL must include an owner and repository name.')
  return { owner, repo: repo.replace(/\.git$/, '') }
}

module.exports = { syncGithubRepos, fetchGithubRepos }
