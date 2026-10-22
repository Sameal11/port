const express = require('express')
const multer = require('multer')
const router = express.Router()
const { requireAdmin } = require('../middleware/authMiddleware')
const admin = require('../services/adminService')
const { syncGithubRepos } = require('../services/githubService')
const { generateResumePdf } = require('../services/resumeService')
const { getAnalyticsSummary, trackEvent } = require('../services/analyticsService')
const { uploadFile, deleteFile, BUCKET_MAP } = require('../services/mediaService')
const { isEncryptionConfigured } = require('../utils/secretCrypto')

// Multer: memory storage (files as Buffer in req.file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
})

function toList(value) {
  if (Array.isArray(value)) return value
  return value ? String(value).split(',').map(s => s.trim()).filter(Boolean) : []
}

function toImageUrls(value) {
  if (typeof value !== 'string') return value || []
  try {
    return JSON.parse(value || '[]')
  } catch {
    return toList(value)
  }
}

// All admin routes require valid Supabase JWT
router.use(requireAdmin)

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────

router.get('/profile', async (req, res, next) => {
  try {
    res.json({ data: await admin.getProfile() })
  } catch (err) { next(err) }
})

router.post('/profile', async (req, res, next) => {
  try {
    res.json({ data: await admin.upsertProfile(req.body) })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────────

router.get('/projects', async (req, res, next) => {
  try {
    res.json({ data: await admin.getProjects() })
  } catch (err) { next(err) }
})

router.post('/projects', async (req, res, next) => {
  try {
    const { technologies, key_features, image_urls, ...rest } = req.body
    const project = {
      ...rest,
      technologies: toList(technologies),
      key_features: toList(key_features),
      image_urls: toImageUrls(image_urls),
    }
    res.status(201).json({ data: await admin.createProject(project) })
  } catch (err) { next(err) }
})

router.put('/projects/:id', async (req, res, next) => {
  try {
    // Partial updates (e.g. toggling `featured`) must not reset the array
    // columns, so only normalise the fields that were actually sent.
    const project = { ...req.body }
    if ('technologies' in project) project.technologies = toList(project.technologies)
    if ('key_features' in project) project.key_features = toList(project.key_features)
    if ('image_urls' in project) project.image_urls = toImageUrls(project.image_urls)
    res.json({ data: await admin.updateProject(req.params.id, project) })
  } catch (err) { next(err) }
})

router.delete('/projects/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteProject(req.params.id))
  } catch (err) { next(err) }
})

router.post('/projects/reorder', async (req, res, next) => {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
    res.json(await admin.reorderProjects(orderedIds))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────────────────────────

router.get('/certifications', async (req, res, next) => {
  try {
    res.json({ data: await admin.getCertifications() })
  } catch (err) { next(err) }
})

router.post('/certifications', async (req, res, next) => {
  try {
    res.status(201).json({ data: await admin.createCertification(req.body) })
  } catch (err) { next(err) }
})

router.put('/certifications/:id', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateCertification(req.params.id, req.body) })
  } catch (err) { next(err) }
})

router.delete('/certifications/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteCertification(req.params.id))
  } catch (err) { next(err) }
})

// Legacy alias
router.post('/certificates', async (req, res, next) => {
  try {
    res.status(201).json({ data: await admin.createCertification(req.body) })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// TECH STACK (alias: skills)
// ─────────────────────────────────────────────────────────────

router.get('/tech-stack', async (req, res, next) => {
  try {
    res.json({ data: await admin.getTechStack() })
  } catch (err) { next(err) }
})

router.post('/tech-stack', async (req, res, next) => {
  try {
    res.status(201).json({ data: await admin.createTechItem(req.body) })
  } catch (err) { next(err) }
})

router.put('/tech-stack/:id', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateTechItem(req.params.id, req.body) })
  } catch (err) { next(err) }
})

router.delete('/tech-stack/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteTechItem(req.params.id))
  } catch (err) { next(err) }
})

router.post('/tech-stack/reorder', async (req, res, next) => {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
    res.json(await admin.reorderTechStack(orderedIds))
  } catch (err) { next(err) }
})

// Legacy alias
router.post('/skills', async (req, res, next) => {
  try {
    res.status(201).json({ data: await admin.createTechItem(req.body) })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// EXPERIENCE
// ─────────────────────────────────────────────────────────────

router.get('/experience', async (req, res, next) => {
  try {
    res.json({ data: await admin.getExperiences() })
  } catch (err) { next(err) }
})

router.post('/experience', async (req, res, next) => {
  try {
    const { description, ...rest } = req.body
    const item = {
      ...rest,
      description: Array.isArray(description) ? description : (description ? description.split('\n').filter(Boolean) : []),
    }
    res.status(201).json({ data: await admin.createExperience(item) })
  } catch (err) { next(err) }
})

router.put('/experience/:id', async (req, res, next) => {
  try {
    const item = { ...req.body }
    if ('description' in item) {
      item.description = Array.isArray(item.description)
        ? item.description
        : (item.description ? item.description.split('\n').filter(Boolean) : [])
    }
    res.json({ data: await admin.updateExperience(req.params.id, item) })
  } catch (err) { next(err) }
})

router.delete('/experience/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteExperience(req.params.id))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// EDUCATION
// ─────────────────────────────────────────────────────────────

router.get('/education', async (req, res, next) => {
  try {
    res.json({ data: await admin.getEducations() })
  } catch (err) { next(err) }
})

router.post('/education', async (req, res, next) => {
  try {
    res.status(201).json({ data: await admin.createEducation(req.body) })
  } catch (err) { next(err) }
})

router.put('/education/:id', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateEducation(req.params.id, req.body) })
  } catch (err) { next(err) }
})

router.delete('/education/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteEducation(req.params.id))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────

router.get('/achievements', async (req, res, next) => {
  try {
    res.json({ data: await admin.getAchievements() })
  } catch (err) { next(err) }
})

router.post('/achievements', async (req, res, next) => {
  try {
    res.status(201).json({ data: await admin.createAchievement(req.body) })
  } catch (err) { next(err) }
})

router.put('/achievements/:id', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateAchievement(req.params.id, req.body) })
  } catch (err) { next(err) }
})

router.delete('/achievements/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteAchievement(req.params.id))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// SOCIAL LINKS
// ─────────────────────────────────────────────────────────────

router.get('/social-links', async (req, res, next) => {
  try {
    res.json({ data: await admin.getSocialLinks() })
  } catch (err) { next(err) }
})

router.post('/social-links', async (req, res, next) => {
  try {
    const { platform, url, visible } = req.body
    res.status(201).json({ data: await admin.upsertSocialLink(platform, url, visible) })
  } catch (err) { next(err) }
})

router.put('/social-links/:id', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateSocialLink(req.params.id, req.body) })
  } catch (err) { next(err) }
})

router.delete('/social-links/:id', async (req, res, next) => {
  try {
    res.json(await admin.deleteSocialLink(req.params.id))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// HOMEPAGE SECTIONS
// ─────────────────────────────────────────────────────────────

router.get('/homepage-sections', async (req, res, next) => {
  try {
    res.json({ data: await admin.getHomepageSections() })
  } catch (err) { next(err) }
})

router.put('/homepage-sections/:id', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateHomepageSection(req.params.id, req.body) })
  } catch (err) { next(err) }
})

router.post('/homepage-sections/reorder', async (req, res, next) => {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' })
    res.json(await admin.reorderHomepageSections(orderedIds))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────

router.get('/theme', async (req, res, next) => {
  try {
    res.json({ data: await admin.getThemeSettings() })
  } catch (err) { next(err) }
})

router.put('/theme', async (req, res, next) => {
  try {
    res.json({ data: await admin.updateThemeSettings(req.body) })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// PORTFOLIO SETTINGS
// ─────────────────────────────────────────────────────────────

router.get('/settings', async (req, res, next) => {
  try {
    res.json({ data: await admin.getAllSettings() })
  } catch (err) { next(err) }
})

router.post('/settings', async (req, res, next) => {
  try {
    const { key, value } = req.body
    if (!key) return res.status(400).json({ error: 'key is required' })
    res.json({ data: await admin.setSetting(key, value) })
  } catch (err) { next(err) }
})

// Lets the admin UI show an accurate "encrypted at rest" indicator instead of
// hardcoding a claim that may not match the server's actual configuration.
router.get('/settings/encryption-status', (req, res) => {
  res.json({ encrypted: isEncryptionConfigured() })
})

// ─────────────────────────────────────────────────────────────
// GITHUB SYNC
// ─────────────────────────────────────────────────────────────

router.post('/github/sync', async (req, res, next) => {
  try {
    const pat = req.body.pat || null
    const result = await syncGithubRepos(pat)
    res.json({ data: result })
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// RESUME
// ─────────────────────────────────────────────────────────────

router.get('/resume', async (req, res, next) => {
  try {
    res.json({ data: await admin.getResumeProfile() })
  } catch (err) { next(err) }
})

router.post('/resume', async (req, res, next) => {
  try {
    const { resumeData } = req.body
    if (!resumeData) return res.status(400).json({ error: 'resumeData is required' })
    const saved = await admin.upsertResumeProfile(resumeData)

    // Auto-sync skills from resume form to tech_stack database table
    if (resumeData.form) {
      const form = resumeData.form;
      const skillsToSync = [];

      const parseSkills = (str, category) => {
        if (!str) return;
        str.split(',').map(s => s.trim()).filter(Boolean).forEach(name => {
          skillsToSync.push({ name, category });
        });
      };

      parseSkills(form.skillLang, 'Languages');
      parseSkills(form.skillWeb, 'Web & Frameworks');
      parseSkills(form.skillAI, 'AI/ML');
      parseSkills(form.skillTools, 'Cloud');

      if (skillsToSync.length > 0) {
        const supabase = require('../supabase/client').getSupabaseClient();
        // Load current skills to avoid duplicates
        const { data: existingSkills } = await supabase.from('tech_stack').select('id, name');
        const existingNames = new Set((existingSkills || []).map(s => s.name.toLowerCase()));

        const newSkills = skillsToSync.filter(s => !existingNames.has(s.name.toLowerCase()));

        if (newSkills.length > 0) {
          await supabase.from('tech_stack').insert(newSkills);
        }
      }
    }

    res.json({ data: saved })
  } catch (err) { next(err) }
})

// Generate + download PDF inline
router.post('/resume/pdf', async (req, res, next) => {
  try {
    const { resumeData, save = false } = req.body
    if (!resumeData) return res.status(400).json({ error: 'resumeData is required' })
    const { pdfBuffer, pdfUrl } = await generateResumePdf(resumeData, save)
    if (save) {
      res.json({ pdfUrl })
    } else {
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"')
      res.send(pdfBuffer)
    }
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// MEDIA LIBRARY
// ─────────────────────────────────────────────────────────────

router.get('/media', async (req, res, next) => {
  try {
    res.json({ data: await admin.getMediaLibrary() })
  } catch (err) { next(err) }
})

router.post('/media/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' })
    const category = req.body.category || 'general'
    const result = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, category)
    res.status(201).json({ data: result })
  } catch (err) { next(err) }
})

router.delete('/media/:id', async (req, res, next) => {
  try {
    const { storagePath, bucket } = req.body
    if (storagePath && bucket) await deleteFile(bucket, storagePath)
    res.json(await admin.deleteMediaItem(req.params.id))
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────

router.get('/analytics', async (req, res, next) => {
  try {
    res.json({ data: await getAnalyticsSummary() })
  } catch (err) { next(err) }
})

// Existing admin portfolio payload (keep backwards compat)
router.get('/portfolio', async (req, res, next) => {
  try {
    const { getPortfolioPayload } = require('../services/portfolioService')
    const data = await getPortfolioPayload()
    const supabase = require('../supabase/client').getSupabaseClient()
    const [p, c, s] = await Promise.all([
      supabase.from('projects').select('id, title, description, technologies').order('created_at', { ascending: false }),
      supabase.from('certifications').select('id, title, image_url').order('created_at', { ascending: false }),
      supabase.from('tech_stack').select('id, name, logo_url').order('created_at', { ascending: false }),
    ])
    res.json({ data: { ...data, projects: p.data || [], certificates: c.data || [], skills: s.data || [] } })
  } catch (err) { next(err) }
})

module.exports = router
