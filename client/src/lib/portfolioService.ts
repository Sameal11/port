import { getApiBaseUrl } from './apiBase'

export type PortfolioProject = {
  id: string
  title: string
  description: string
  image_url: string | null
  image_urls: string[]
  github_url: string | null
  live_url: string | null
  technologies: string[]
  key_features: string[]
  featured?: boolean
}

export type PortfolioSkill = {
  id: string
  name: string
  category: string | null
  logo_url: string | null
}

export type PortfolioCertification = {
  id: string
  title: string
  issuer: string | null
  issue_date: string | null
  credential_url: string | null
  image_url: string | null
}

export type PortfolioAchievement = {
  id: string
  title: string
  description: string | null
  date: string | null
}

export type PortfolioExperience = {
  id: string
  company: string
  role: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  description: string[] | string | null
  location: string | null
}

export type PortfolioEducation = {
  id: string
  degree: string
  institution: string
  location: string | null
  year: string | null
  gpa: string | null
}

export type HomepageSection = {
  id: number
  section_key: string
  label: string
  visible: boolean
  display_order: number
}

export type ThemeSettings = {
  primary_color: string
  secondary_color: string
  dark_mode: boolean
  animations_enabled: boolean
  hero_bg_type: string
  hero_bg_value: string | null
}

export type PortfolioResumeLink = {
  id: string
  label: string
  url: string
  is_primary: boolean
}

export type PortfolioSocialLink = {
  id: string
  platform: string
  label: string
  username: string | null
  url: string
  featured: boolean
}

export type PortfolioPersonalInfo = {
  full_name: string
  title: string | null
  brand_name: string
  availability_text: string | null
  hero_title_primary: string | null
  hero_title_secondary: string | null
  hero_rotating_titles: string[]
  hero_description: string | null
  hero_footer_primary: string | null
  hero_footer_secondary: string | null
  tagline: string | null
  bio: string | null
  email: string | null
  location: string | null
}

export type PortfolioAboutInfo = {
  description: string | null
  quote: string | null
  profile_image_url: string | null
}

export type PortfolioData = {
  personalInfo: PortfolioPersonalInfo | null
  about: PortfolioAboutInfo | null
  projects: PortfolioProject[]
  skills: PortfolioSkill[]
  certifications: PortfolioCertification[]
  achievements: PortfolioAchievement[]
  socialLinks: PortfolioSocialLink[]
  experience: PortfolioExperience[]
  education: PortfolioEducation[]
  resumeLinks: PortfolioResumeLink[]
  homepageSections: HomepageSection[]
  theme: ThemeSettings | null
}


const JSON_HEADERS = {
  Accept: 'application/json',
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}

async function fetchJson(path: string) {
  const response = await fetch(buildUrl(path), {
    headers: JSON_HEADERS,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Request failed for ${path} (${response.status})`)
  }

  return response.json()
}

function unwrapPayload<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload)
  ) {
    const candidate = payload as Record<string, unknown>

    if ('data' in candidate) {
      return candidate.data as T
    }

    if ('result' in candidate) {
      return candidate.result as T
    }
  }

  return payload as T
}

async function fetchFirstAvailable<T>(
  paths: string[]
): Promise<T | null> {
  for (const path of paths) {
    try {
      const payload = await fetchJson(path)
      return unwrapPayload<T>(payload)
    } catch {
      continue
    }
  }

  return null
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function toNullableString(value: unknown) {
  return typeof value === 'string' && value.trim()
    ? value
    : null
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringValue(item).trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeProject(item: unknown): PortfolioProject {
  const project = (item || {}) as Record<string, unknown>

  return {
    id: String(project.id ?? ''),
    title: toStringValue(project.title),
    description: toStringValue(project.description),
    image_url: toNullableString(project.image_url),
    image_urls: toStringArray(project.image_urls),
    github_url: toNullableString(project.github_url),
    live_url: toNullableString(project.live_url),
    technologies: toStringArray(project.technologies),
    key_features: toStringArray(project.key_features),
    featured: Boolean(project.featured),
  }
}

function normalizeSkill(item: unknown): PortfolioSkill {
  const skill = (item || {}) as Record<string, unknown>

  return {
    id: String(skill.id ?? skill.name ?? ''),
    name: toStringValue(skill.name),
    category: toNullableString(skill.category),
    logo_url: toNullableString(skill.logo_url),
  }
}

function normalizeCertification(
  item: unknown
): PortfolioCertification {
  const certification = (item || {}) as Record<string, unknown>

  return {
    id: String(certification.id ?? ''),
    title: toStringValue(certification.title),
    issuer: toNullableString(certification.issuer),
    issue_date: toNullableString(certification.issue_date),
    credential_url: toNullableString(
      certification.credential_url
    ),
    image_url: toNullableString(certification.image_url),
  }
}

function normalizeAchievement(
  item: unknown
): PortfolioAchievement {
  const achievement = (item || {}) as Record<string, unknown>

  return {
    id: String(achievement.id ?? achievement.title ?? ''),
    title: toStringValue(achievement.title),
    description: toNullableString(achievement.description),
    date: toNullableString(achievement.date),
  }
}

function normalizeExperience(
  item: unknown
): PortfolioExperience {
  const experience = (item || {}) as Record<string, unknown>

  return {
    id: String(experience.id ?? experience.company ?? ''),
    company: toStringValue(experience.company),
    role: toStringValue(experience.role),
    location: toNullableString(experience.location),
    start_date: toNullableString(experience.start_date),
    end_date: toNullableString(experience.end_date),
    is_current: Boolean(experience.is_current),
    description: Array.isArray(experience.description)
      ? experience.description as string[]
      : toNullableString(experience.description),
  }
}

function normalizeEducation(
  item: unknown
): PortfolioEducation {
  const edu = (item || {}) as Record<string, unknown>
  return {
    id: String(edu.id ?? ''),
    degree: toStringValue(edu.degree),
    institution: toStringValue(edu.institution),
    location: toNullableString(edu.location),
    year: toNullableString(edu.year),
    gpa: toNullableString(edu.gpa),
  }
}

function normalizeResumeLink(
  item: unknown
): PortfolioResumeLink {
  const resumeLink = (item || {}) as Record<string, unknown>

  return {
    id: String(resumeLink.id ?? resumeLink.label ?? ''),
    label: toStringValue(resumeLink.label || 'Resume'),
    url: toStringValue(resumeLink.url),
    is_primary: Boolean(
      resumeLink.is_primary ?? resumeLink.primary
    ),
  }
}

function normalizeSocialLink(
  item: unknown
): PortfolioSocialLink {
  const socialLink = (item || {}) as Record<string, unknown>

  return {
    id: String(
      socialLink.id ?? socialLink.platform ?? socialLink.label ?? ''
    ),
    platform: toStringValue(
      socialLink.platform || socialLink.title || socialLink.label
    ),
    label: toStringValue(
      socialLink.label || socialLink.title || socialLink.platform
    ),
    username: toNullableString(
      socialLink.username || socialLink.user || socialLink.handle
    ),
    url: toStringValue(socialLink.url || socialLink.link),
    featured: Boolean(
      socialLink.featured ?? socialLink.is_featured
    ),
  }
}

function normalizePersonalInfo(
  value: unknown
): PortfolioPersonalInfo | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const info = value as Record<string, unknown>

  return {
    full_name: toStringValue(info.full_name || info.name),
    title: toNullableString(info.title),
    brand_name: toStringValue(
      info.brand_name || info.slug || info.short_name
    ),
    availability_text: toNullableString(
      info.availability_text || info.availability
    ),
    hero_title_primary: toNullableString(
      info.hero_title_primary || info.hero_title_1 || info.full_name || info.name
    ),
    hero_title_secondary: toNullableString(
      info.hero_title_secondary || info.hero_title_2 || info.title
    ),
    hero_rotating_titles: toStringArray(
      info.hero_rotating_titles || info.rotating_titles
    ),
    hero_description: toNullableString(
      info.hero_description || info.bio || info.tagline
    ),
    hero_footer_primary: toNullableString(
      info.hero_footer_primary
    ),
    hero_footer_secondary: toNullableString(
      info.hero_footer_secondary
    ),
    tagline: toNullableString(info.tagline),
    bio: toNullableString(info.bio),
    email: toNullableString(info.email),
    location: toNullableString(info.location),
  }
}

function normalizeAboutInfo(
  value: unknown
): PortfolioAboutInfo | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const about = value as Record<string, unknown>

  return {
    description: toNullableString(
      about.description || about.summary
    ),
    quote: toNullableString(about.quote),
    profile_image_url: toNullableString(
      about.profile_image_url || about.image_url
    ),
  }
}

function normalizePortfolioPayload(
  payload: unknown
): PortfolioData {
  const source =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}

  return {
    personalInfo: normalizePersonalInfo(
      source.personalInfo ??
        source.personal_information ??
        source.personal_info
    ),
    about: normalizeAboutInfo(
      source.about ?? source.aboutSection ?? source.about_section
    ),
    projects: Array.isArray(source.projects)
      ? source.projects.map(normalizeProject)
      : [],
    skills: Array.isArray(source.skills)
      ? source.skills.map(normalizeSkill)
      : Array.isArray(source.techStacks)
      ? source.techStacks.map(normalizeSkill)
      : Array.isArray(source.tech_stack)
      ? source.tech_stack.map(normalizeSkill)
      : [],
    certifications: Array.isArray(source.certifications)
      ? source.certifications.map(normalizeCertification)
      : Array.isArray(source.certificates)
      ? source.certificates.map(normalizeCertification)
      : [],
    achievements: Array.isArray(source.achievements)
      ? source.achievements.map(normalizeAchievement)
      : [],
    socialLinks: Array.isArray(source.socialLinks)
      ? source.socialLinks.map(normalizeSocialLink)
      : Array.isArray(source.social_links)
      ? source.social_links.map(normalizeSocialLink)
      : [],
    experience: Array.isArray(source.experience)
      ? source.experience.map(normalizeExperience)
      : Array.isArray(source.experiences)
      ? source.experiences.map(normalizeExperience)
      : [],
    education: Array.isArray(source.education)
      ? source.education.map(normalizeEducation)
      : [],
    resumeLinks: Array.isArray(source.resumeLinks)
      ? source.resumeLinks.map(normalizeResumeLink)
      : Array.isArray(source.resume_links)
      ? source.resume_links.map(normalizeResumeLink)
      : [],
    homepageSections: Array.isArray(source.homepageSections)
      ? (source.homepageSections as HomepageSection[])
      : [],
    theme: source.theme && typeof source.theme === 'object'
      ? (source.theme as ThemeSettings)
      : null,
  }
}

const aggregatePortfolioEndpoints = [
  '/portfolio',
  '/portfolio/overview',
]

const sectionEndpoints = {
  personalInfo: [
    '/portfolio/personal-info',
    '/portfolio/personal',
    '/personal-info',
    '/profile',
  ],
  about: ['/portfolio/about', '/about'],
  projects: ['/portfolio/projects', '/projects'],
  skills: [
    '/portfolio/skills',
    '/portfolio/tech-stack',
    '/skills',
    '/tech-stack',
  ],
  certifications: [
    '/portfolio/certifications',
    '/portfolio/certificates',
    '/certifications',
    '/certificates',
  ],
  achievements: [
    '/portfolio/achievements',
    '/achievements',
  ],
  socialLinks: [
    '/portfolio/social-links',
    '/portfolio/socials',
    '/social-links',
    '/socials',
  ],
  experience: ['/portfolio/experience', '/experience'],
  resumeLinks: [
    '/portfolio/resume-links',
    '/portfolio/resume',
    '/resume-links',
    '/resume',
  ],
}

async function fetchPortfolioAggregate() {
  const payload = await fetchFirstAvailable<unknown>(
    aggregatePortfolioEndpoints
  )

  return payload ? normalizePortfolioPayload(payload) : null
}

async function fetchPortfolioSections(): Promise<PortfolioData> {
  const [
    personalInfo,
    about,
    projects,
    skills,
    certifications,
    achievements,
    socialLinks,
    experience,
    resumeLinks,
  ] = await Promise.all([
    fetchFirstAvailable<unknown>(sectionEndpoints.personalInfo),
    fetchFirstAvailable<unknown>(sectionEndpoints.about),
    fetchFirstAvailable<unknown>(sectionEndpoints.projects),
    fetchFirstAvailable<unknown>(sectionEndpoints.skills),
    fetchFirstAvailable<unknown>(sectionEndpoints.certifications),
    fetchFirstAvailable<unknown>(sectionEndpoints.achievements),
    fetchFirstAvailable<unknown>(sectionEndpoints.socialLinks),
    fetchFirstAvailable<unknown>(sectionEndpoints.experience),
    fetchFirstAvailable<unknown>(sectionEndpoints.resumeLinks),
  ])

  return normalizePortfolioPayload({
    personalInfo,
    about,
    projects: Array.isArray(projects) ? projects : [],
    skills: Array.isArray(skills) ? skills : [],
    certifications: Array.isArray(certifications)
      ? certifications
      : [],
    achievements: Array.isArray(achievements)
      ? achievements
      : [],
    socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
    experience: Array.isArray(experience) ? experience : [],
    resumeLinks: Array.isArray(resumeLinks) ? resumeLinks : [],
  })
}

export async function fetchPortfolioData() {
  const aggregate = await fetchPortfolioAggregate()

  if (aggregate) {
    return aggregate
  }

  const sections = await fetchPortfolioSections()
  const hasAnyData = Object.values(sections).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0
    }

    return value !== null
  })

  if (!hasAnyData) {
    console.error(
      '[portfolio] The API returned no data. Check that /api/portfolio responds and that NEXT_PUBLIC_PORTFOLIO_API_BASE_URL is unset in production.'
    )
    throw new Error("Couldn't load portfolio content right now. Please refresh in a moment.")
  }

  return sections
}

export async function fetchProjects() {
  const portfolio = await fetchPortfolioData()
  return portfolio.projects
}

export async function fetchCertificates() {
  const portfolio = await fetchPortfolioData()
  return portfolio.certifications
}

export async function fetchTechStacks() {
  const portfolio = await fetchPortfolioData()
  return portfolio.skills
}

export async function fetchProjectById(id: string) {
  const directProject = await fetchFirstAvailable<unknown>([
    `/portfolio/projects/${id}`,
    `/projects/${id}`,
  ])

  if (directProject) {
    return normalizeProject(directProject)
  }

  const projects = await fetchProjects()
  return projects.find((project) => project.id === id) ?? null
}
