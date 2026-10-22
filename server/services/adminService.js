const { getSupabaseClient } = require('../supabase/client')
const { encrypt, decrypt } = require('../utils/secretCrypto')

// ─── Generic helpers ────────────────────────────────────────────────────────

function db() {
  return getSupabaseClient()
}

async function getAll(table, opts = {}) {
  let q = db().from(table).select('*')
  if (opts.order)     q = q.order(opts.order, { ascending: opts.ascending ?? true })
  if (opts.filter)    q = q.eq(opts.filter.col, opts.filter.val)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

async function getById(table, id) {
  const { data, error } = await db().from(table).select('*').eq('id', id).single()
  if (error) throw error
  return data
}

async function insert(table, payload) {
  const { data, error } = await db().from(table).insert(payload).select().single()
  if (error) throw error
  return data
}

async function update(table, id, payload) {
  const { data, error } = await db().from(table).update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

async function remove(table, id) {
  const { error } = await db().from(table).delete().eq('id', id)
  if (error) throw error
  return { deleted: true }
}

async function upsertByKey(table, keyCol, keyVal, payload) {
  const { data, error } = await db()
    .from(table)
    .upsert({ [keyCol]: keyVal, ...payload })
    .eq(keyCol, keyVal)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Profile ─────────────────────────────────────────────────────────────────

async function getProfile() {
  const { data } = await db().from('profiles').select('*').limit(1).maybeSingle()
  return data || null
}

async function upsertProfile(payload) {
  const existing = await getProfile()
  if (existing) {
    return await update('profiles', existing.id, { ...payload, updated_at: new Date().toISOString() })
  }
  return await insert('profiles', payload)
}

// ─── Projects ────────────────────────────────────────────────────────────────

const getProjects     = () => getAll('projects', { order: 'display_order' })
const getProject      = (id) => getById('projects', id)
const createProject   = (p) => insert('projects', p)
const updateProject   = (id, p) => update('projects', id, { ...p, updated_at: new Date().toISOString() })
const deleteProject   = (id) => remove('projects', id)

async function reorderProjects(orderedIds) {
  const ops = orderedIds.map((id, idx) =>
    db().from('projects').update({ display_order: idx }).eq('id', id)
  )
  await Promise.all(ops)
  return { reordered: true }
}

// ─── Certifications ───────────────────────────────────────────────────────────

const getCertifications   = () => getAll('certifications', { order: 'created_at', ascending: false })
const getCertification    = (id) => getById('certifications', id)
const createCertification = (c) => insert('certifications', c)
const updateCertification = (id, c) => update('certifications', id, c)
const deleteCertification = (id) => remove('certifications', id)

// ─── Tech Stack ───────────────────────────────────────────────────────────────

const getTechStack       = () => getAll('tech_stack', { order: 'display_order' })
const createTechItem     = (t) => insert('tech_stack', t)
const updateTechItem     = (id, t) => update('tech_stack', id, t)
const deleteTechItem     = (id) => remove('tech_stack', id)

async function reorderTechStack(orderedIds) {
  const ops = orderedIds.map((id, idx) =>
    db().from('tech_stack').update({ display_order: idx }).eq('id', id)
  )
  await Promise.all(ops)
  return { reordered: true }
}

// ─── Experience ───────────────────────────────────────────────────────────────

const getExperiences    = () => getAll('experience', { order: 'display_order' })
const createExperience  = (e) => insert('experience', e)
const updateExperience  = (id, e) => update('experience', id, e)
const deleteExperience  = (id) => remove('experience', id)

// ─── Education ────────────────────────────────────────────────────────────────

const getEducations    = () => getAll('education', { order: 'display_order' })
const createEducation  = (e) => insert('education', e)
const updateEducation  = (id, e) => update('education', id, e)
const deleteEducation  = (id) => remove('education', id)

// ─── Achievements ─────────────────────────────────────────────────────────────

const getAchievements    = () => getAll('achievements', { order: 'display_order' })
const createAchievement  = (a) => insert('achievements', a)
const updateAchievement  = (id, a) => update('achievements', id, a)
const deleteAchievement  = (id) => remove('achievements', id)

// ─── Social Links ─────────────────────────────────────────────────────────────

const getSocialLinks    = () => getAll('social_links', { order: 'platform' })
const createSocialLink  = (s) => insert('social_links', s)
const updateSocialLink  = (id, s) => update('social_links', id, s)
const deleteSocialLink  = (id) => remove('social_links', id)

async function upsertSocialLink(platform, url, visible = true) {
  // Check if a record already exists for this platform
  const { data: existing, error: fetchError } = await db()
    .from('social_links')
    .select('id')
    .eq('platform', platform)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing) {
    // Update existing record
    const { data, error } = await db()
      .from('social_links')
      .update({ url, visible })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    // Insert new record
    const { data, error } = await db()
      .from('social_links')
      .insert({ platform, url, visible })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ─── Homepage Sections ────────────────────────────────────────────────────────

const getHomepageSections = () => getAll('homepage_sections', { order: 'display_order' })

async function updateHomepageSection(id, payload) {
  return await update('homepage_sections', id, payload)
}

async function reorderHomepageSections(orderedIds) {
  const ops = orderedIds.map((id, idx) =>
    db().from('homepage_sections').update({ display_order: idx + 1 }).eq('id', id)
  )
  await Promise.all(ops)
  return { reordered: true }
}

// ─── Theme Settings ───────────────────────────────────────────────────────────

async function getThemeSettings() {
  const { data } = await db().from('theme_settings').select('*').eq('id', 1).maybeSingle()
  return data || {}
}

async function updateThemeSettings(payload) {
  const { data, error } = await db()
    .from('theme_settings')
    .upsert({ id: 1, ...payload })
    .eq('id', 1)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Portfolio Settings (key-value) ───────────────────────────────────────────

// Keys whose values are encrypted at rest with SETTINGS_ENCRYPTION_KEY.
// github_pat is a live credential, so it must never sit in the DB as plaintext.
const SENSITIVE_SETTING_KEYS = new Set(['github_pat'])

async function getSetting(key) {
  const { data } = await db()
    .from('portfolio_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  const value = data?.value || null
  if (value && SENSITIVE_SETTING_KEYS.has(key)) {
    return decrypt(value)
  }
  return value
}

async function setSetting(key, value) {
  const storedValue = SENSITIVE_SETTING_KEYS.has(key) ? encrypt(value) : value
  const { data, error } = await db()
    .from('portfolio_settings')
    .upsert({ key, value: storedValue, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    .select()
    .single()
  if (error) throw error
  return data
}

async function getAllSettings() {
  const { data, error } = await db().from('portfolio_settings').select('*')
  if (error) throw error
  return (data || []).reduce((acc, row) => {
    // Sensitive values (e.g. github_pat) are never sent to the browser, even
    // encrypted — the client only needs to know one is configured. Sending
    // ciphertext back would also break the admin form, since it would try to
    // display it as the literal token value.
    if (SENSITIVE_SETTING_KEYS.has(row.key)) {
      acc[row.key] = row.value ? '__SET__' : ''
    } else {
      acc[row.key] = row.value
    }
    return acc
  }, {})
}

// ─── Resume Profile ───────────────────────────────────────────────────────────

async function getResumeProfile() {
  const { data } = await db().from('resume_profile').select('*').limit(1).maybeSingle()
  return data || null
}

async function upsertResumeProfile(resumeData, pdfUrl = null) {
  const existing = await getResumeProfile()
  const payload = {
    resume_data: resumeData,
    updated_at: new Date().toISOString(),
    ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
  }
  if (existing) {
    return await update('resume_profile', existing.id, payload)
  }
  return await insert('resume_profile', { ...payload, resume_data: resumeData })
}

// ─── Media Library ────────────────────────────────────────────────────────────

async function getMediaLibrary() {
  return await getAll('media_library', { order: 'created_at', ascending: false })
}

async function addMediaItem(item) {
  return await insert('media_library', item)
}

async function deleteMediaItem(id) {
  return await remove('media_library', id)
}

module.exports = {
  // Profile
  getProfile, upsertProfile,
  // Projects
  getProjects, getProject, createProject, updateProject, deleteProject, reorderProjects,
  // Certifications
  getCertifications, getCertification, createCertification, updateCertification, deleteCertification,
  // Tech Stack
  getTechStack, createTechItem, updateTechItem, deleteTechItem, reorderTechStack,
  // Experience
  getExperiences, createExperience, updateExperience, deleteExperience,
  // Education
  getEducations, createEducation, updateEducation, deleteEducation,
  // Achievements
  getAchievements, createAchievement, updateAchievement, deleteAchievement,
  // Social Links
  getSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink, upsertSocialLink,
  // Homepage
  getHomepageSections, updateHomepageSection, reorderHomepageSections,
  // Theme
  getThemeSettings, updateThemeSettings,
  // Settings
  getSetting, setSetting, getAllSettings,
  // Resume
  getResumeProfile, upsertResumeProfile,
  // Media
  getMediaLibrary, addMediaItem, deleteMediaItem,
}
