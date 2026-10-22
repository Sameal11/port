const { getSupabaseClient } = require('../supabase/client')

async function getTableRows(table, options = {}) {
  const supabase = getSupabaseClient()
  const orderColumn = options.orderBy || 'created_at'
  const ascending = options.ascending ?? true

  let q = supabase.from(table).select('*').order(orderColumn, { ascending })

  if (options.filterVisible) q = q.eq('visible', true)

  const { data, error } = await q
  if (error) throw error
  return data || []
}

async function getPortfolioPayload() {
  const supabase = getSupabaseClient()

  const [
    projectsResult,
    certificationsResult,
    skillsResult,
    profileResult,
    socialLinksResult,
    experienceResult,
    educationResult,
    achievementsResult,
    resumeResult,
    homepageSectionsResult,
    themeResult,
  ] = await Promise.allSettled([
    supabase.from('projects').select('*').eq('visible', true).order('display_order', { ascending: true }),
    supabase.from('certifications').select('*').eq('visible', true).order('created_at', { ascending: false }),
    supabase.from('tech_stack').select('*').eq('visible', true).order('display_order', { ascending: true }),
    supabase.from('profiles').select('*').limit(1).maybeSingle(),
    supabase.from('social_links').select('*').eq('visible', true).order('platform'),
    supabase.from('experience').select('*').order('display_order', { ascending: true }),
    supabase.from('education').select('*').order('display_order', { ascending: true }),
    supabase.from('achievements').select('*').order('display_order', { ascending: true }),
    supabase.from('resume_profile').select('pdf_url').limit(1).maybeSingle(),
    supabase.from('homepage_sections').select('*').eq('visible', true).order('display_order'),
    supabase.from('theme_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  const extract = (result, fallback) => {
    if (result.status === 'fulfilled' && !result.value.error) return result.value.data
    return fallback
  }

  const profile = extract(profileResult, null)
  const resumeRow = extract(resumeResult, null)

  const about = profile ? {
    description: profile.bio,
    quote: null,
    profile_image_url: profile.profile_image_url
  } : null

  return {
    personalInfo:     profile,
    about,
    projects:         extract(projectsResult, []),
    certifications:   extract(certificationsResult, []),
    skills:           extract(skillsResult, []),
    socialLinks:      extract(socialLinksResult, []),
    experience:       extract(experienceResult, []),
    education:        extract(educationResult, []),
    achievements:     extract(achievementsResult, []),
    resumeLinks:      resumeRow?.pdf_url ? [{ label: 'Download Resume', url: resumeRow.pdf_url }] : [],
    homepageSections: extract(homepageSectionsResult, []),
    theme:            extract(themeResult, null),
  }
}

async function getProjectById(id) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

module.exports = {
  getPortfolioPayload,
  getProjectById,
}
