const { getSupabaseClient } = require('../supabase/client')

/**
 * Track a portfolio analytics event
 * @param {string} eventType - page_view | resume_download | project_click | github_click | contact_submit
 * @param {object} eventData - arbitrary JSON metadata
 * @param {string|null} ipHash  - hashed IP for deduplication (optional)
 */
async function trackEvent(eventType, eventData = {}, ipHash = null) {
  const supabase = getSupabaseClient()
  const { error } = await supabase.from('analytics_events').insert({
    event_type: eventType,
    event_data: eventData,
    ip_hash: ipHash,
  })
  if (error) throw error
  return { tracked: true }
}

/**
 * Get aggregated analytics summary
 */
async function getAnalyticsSummary() {
  const supabase = getSupabaseClient()

  // Get total count per event_type
  const { data: rawCounts, error: countError } = await supabase
    .from('analytics_events')
    .select('event_type')

  if (countError) throw countError

  const counts = {}
  for (const row of rawCounts || []) {
    counts[row.event_type] = (counts[row.event_type] || 0) + 1
  }

  // Get last 30 days daily page_views for chart
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: recentViews, error: viewsError } = await supabase
    .from('analytics_events')
    .select('created_at, event_type')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: true })

  if (viewsError) throw viewsError

  // Group by date
  const dailyMap = {}
  for (const row of recentViews || []) {
    const day = row.created_at.slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { date: day, page_views: 0, total: 0 }
    dailyMap[day].total++
    if (row.event_type === 'page_view') dailyMap[day].page_views++
  }

  return {
    totals: {
      page_views:        counts['page_view']        || 0,
      resume_downloads:  counts['resume_download']  || 0,
      project_clicks:    counts['project_click']    || 0,
      github_clicks:     counts['github_click']     || 0,
      contact_submits:   counts['contact_submit']   || 0,
    },
    daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
  }
}

module.exports = { trackEvent, getAnalyticsSummary }
