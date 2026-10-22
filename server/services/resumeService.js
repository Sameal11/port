const fs = require('fs')
const { execSync } = require('child_process')
const puppeteer = require('puppeteer')
const { upsertResumeProfile } = require('./adminService')
const { uploadFile } = require('./mediaService')

function findBrowserExecutable() {
  const explicit =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.CHROMIUM_PATH
  if (explicit) return explicit

  const paths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/opt/google/chrome/chrome',
  ]

  for (const candidate of paths) {
    if (fs.existsSync(candidate)) return candidate
  }

  const lookups = [
    'google-chrome-stable',
    'google-chrome',
    'chromium-browser',
    'chromium',
  ]

  for (const command of lookups) {
    try {
      const resolved = execSync(`command -v ${command}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
      if (resolved) return resolved
    } catch (err) {
      // ignore missing commands
    }
  }

  return undefined
}

/**
 * Escapes text for safe interpolation into HTML (both element content and
 * quoted attribute values, e.g. href="...").
 *
 * Added because none of the resume fields were escaped before — a bullet
 * point containing "<", ">", "&", or a project/certification URL containing
 * a double quote would corrupt the layout or break out of an href attribute.
 */
function esc(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Extracts a trailing date / date-range from a free-text line, e.g.
 *   "Google Cybersecurity Professional Certificate - May 2025 - Jun 2025"
 *   "NPTEL Information Security Elite Certificate – Jan 2025 - Mar 2025"
 *   "Oracle Cloud Infrastructure 2025 Certified DevOps Professional - Oct 2025"
 * Works regardless of whether a hyphen (-) or en dash (–) was used, and
 * regardless of whether there's one date or a date range at the end.
 * Returns { title, dateText }.
 */
const MONTHS = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*';
const DATE_TOKEN = `${MONTHS}\\.?\\s+\\d{4}`;
// Matches "Mon YYYY", or "Mon YYYY - Mon YYYY" (either dash style), at the END of the string
const TRAILING_DATE_RE = new RegExp(
  `[\\s\\-\u2013|]+(${DATE_TOKEN}(?:\\s*[\\-\u2013]\\s*${DATE_TOKEN})?)\\s*$`
);

function splitTitleAndDate(line) {
  const clean = line.replace(/^[-•*]\s*/, '').trim();
  const match = clean.match(TRAILING_DATE_RE);
  if (match) {
    return {
      title: clean.slice(0, match.index).trim(),
      dateText: match[1].trim(),
    };
  }
  // No date found at the end — fall back to old "dash separates title/issuer" behavior,
  // but only if the remainder isn't itself date-shaped garbage.
  const dashIdx = clean.search(/[\-\u2013]/);
  if (dashIdx > -1) {
    return {
      title: clean.slice(0, dashIdx).trim(),
      dateText: '',
      issuer: clean.slice(dashIdx + 1).trim(),
    };
  }
  return { title: clean, dateText: '' };
}

/**
 * Pull a CGPA/GPA/marks value out of a form object, trying every field name
 * the frontend might realistically use, and label it appropriately —
 * schools report "Percentage", colleges usually report "CGPA".
 */
function extractScore(form, prefix) {
  const gpaKeys = [`${prefix}Gpa`, `${prefix}GPA`, `${prefix}Cgpa`, `${prefix}CGPA`];
  const marksKeys = [`${prefix}Marks`, `${prefix}Percentage`, `${prefix}Percent`, `${prefix}Score`, `${prefix}Grade`];

  for (const key of gpaKeys) {
    if (form[key]) return { label: 'CGPA', value: String(form[key]) };
  }
  for (const key of marksKeys) {
    if (form[key]) {
      const raw = String(form[key]);
      const value = raw.includes('%') ? raw : `${raw}%`;
      return { label: 'Percentage', value };
    }
  }
  return null;
}

/**
 * Build a human label + value for whatever an education entry actually has,
 * whether it came from the structured resumeData.education array (gpa /
 * percentage / marks fields) or was inferred from a raw form value.
 */
function formatEduScore(entry) {
  if (entry.scoreLabel && entry.scoreValue) return `${entry.scoreLabel}: ${entry.scoreValue}`;
  if (entry.gpa) return `CGPA: ${entry.gpa}`;
  if (entry.percentage) return `Percentage: ${String(entry.percentage).includes('%') ? entry.percentage : entry.percentage + '%'}`;
  if (entry.marks) return `Percentage: ${String(entry.marks).includes('%') ? entry.marks : entry.marks + '%'}`;
  return '';
}

/**
 * Build an HTML string from the resume data JSON
 */
function buildResumeHtml(resumeData) {
  // Gracefully handle if the payload is wrapped in { form, projects, certifications, achievements }
  const form = resumeData.form || {};

  const personal = {
    full_name: form.name || resumeData.personal?.full_name || '',
    title: form.title || resumeData.personal?.title || '',
    email: form.email || resumeData.personal?.email || '',
    phone: form.phone || resumeData.personal?.phone || '',
    location: form.location || resumeData.personal?.location || '',
    linkedin: form.linkedin || resumeData.personal?.linkedin || '',
    github: form.github || resumeData.personal?.github || '',
  };

  // Clean date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const section = (title, content) => content ? `
    <div class="section">
      <h2>${esc(title)}</h2>
      <div class="divider"></div>
      ${content}
    </div>` : ''

  // Professional Summary — was previously missing entirely from the generated
  // PDF, even though the frontend live preview shows it. Falls back across
  // every shape resumeData might arrive in.
  const summary = form.objective || resumeData.summary || resumeData.personal?.summary || '';
  const summaryHtml = summary ? `<p>${esc(summary)}</p>` : '';

  // Education: support either a structured array from resumeData, or reconstructed
  // from form fields. Supports THREE entries (edu, edu2, edu3) — e.g. Bachelor's,
  // Class XII, Class X — since most Indian resumes list all three. Each can carry
  // either a CGPA (college) or a Percentage (school); both are auto-detected from
  // whichever field name the form actually used.
  let education = resumeData.education || [];
  if (education.length === 0) {
    for (const prefix of ['edu', 'edu2', 'edu3']) {
      const degreeKey = `${prefix}Degree`;
      if (!form[degreeKey]) continue;
      const score = extractScore(form, prefix);
      education.push({
        degree: form[degreeKey],
        institution: form[`${prefix}College`],
        year: form[`${prefix}Year`],
        location: form[`${prefix}Location`] || '',
        scoreLabel: score?.label,
        scoreValue: score?.value,
      });
    }
  }

  const eduHtml = education.map(e => {
    const scoreText = formatEduScore(e);
    return `
    <div class="entry">
      <div class="entry-header">
        <strong>${esc(e.degree)}</strong>
        <span class="date">${esc(e.year)}</span>
      </div>
      <div class="entry-sub">${esc(e.institution)}${e.location ? ` — ${esc(e.location)}` : ''}${scoreText ? ` | ${esc(scoreText)}` : ''}</div>
    </div>`;
  }).join('')

  // Experience: support either structured array from resumeData or parsed from form.experience
  let experience = resumeData.experience || [];
  if (experience.length === 0 && form.experience) {
    const blocks = form.experience.split(/\n{2,}/).filter(b => b.trim());
    experience = blocks.map(block => {
      const lines = block.split('\n').filter(l => l.trim());
      if (!lines.length) return null;
      const parts = lines[0].split('|').map(s => s.trim());
      return {
        role: parts[0] || '',
        company: parts[1] || '',
        location: parts[2] || '',
        dateRange: parts[3] || '',
        description: lines.slice(1).map(l => l.replace(/^[-•*]\s*/, '')),
      };
    }).filter(Boolean);
  }

  const expHtml = experience.map(e => {
    // Robustly parse description: support string bullets separated by \n or standard array
    let bulletsHtml = '';
    const desc = e.description || '';
    const lines = Array.isArray(desc)
      ? desc
      : typeof desc === 'string'
        ? desc.split('\n').map(l => l.trim()).filter(Boolean)
        : [];
    if (lines.length > 0) {
      bulletsHtml = `<ul>${lines.map(line => `<li>${esc(line)}</li>`).join('')}</ul>`;
    }

    const dateText = e.dateRange || (e.start_date ? `${formatDate(e.start_date)}${e.end_date ? ` – ${formatDate(e.end_date)}` : e.is_current ? ' – Present' : ''}` : '');

    return `
    <div class="entry">
      <div class="entry-header">
        <strong>${esc(e.role)}</strong>
        <span class="date">${esc(dateText)}</span>
      </div>
      <div class="entry-sub">${esc(e.company)}${e.location ? ` — ${esc(e.location)}` : ''}</div>
      ${bulletsHtml}
    </div>`;
  }).join('')

  // Projects: support either structured array or raw projects list
  const projects = resumeData.projects || [];

  const projHtml = projects.map(p => {
    // Robustly parse technologies to prevent .join crashes if technologies is a string
    const techStr = Array.isArray(p.technologies)
      ? p.technologies.join(', ')
      : typeof p.technologies === 'string'
        ? p.technologies
        : p.tech || '';

    let bulletsHtml = '';
    const bullets = p.description || p.bullets || '';
    const lines = Array.isArray(bullets)
      ? bullets
      : typeof bullets === 'string'
        ? bullets.split('\n').map(l => l.trim()).filter(Boolean)
        : [];
    if (lines.length > 0) {
      bulletsHtml = `<ul>${lines.map(line => `<li>${esc(line)}</li>`).join('')}</ul>`;
    }

    const links = [];
    const liveUrl = p.live_url || p.liveUrl;
    const repoUrl = p.github_url || p.repoUrl;
    if (liveUrl) links.push(`<a href="${esc(liveUrl)}" class="link" target="_blank">Live Demo</a>`);
    if (repoUrl) links.push(`<a href="${esc(repoUrl)}" class="link" target="_blank">GitHub</a>`);
    const linksHtml = links.length > 0 ? ` | ${links.join(' | ')}` : '';

    return `
    <div class="entry">
      <div class="entry-header">
        <strong>${esc(p.title)}${techStr ? ` <span style="font-weight: normal; font-style: italic;">| ${esc(techStr)}</span>` : ''}${linksHtml}</strong>
        <span class="date">${esc(p.date)}</span>
      </div>
      ${bulletsHtml}
    </div>`;
  }).join('')

  // Skills: support either flat array / objects, or split from form skill fields
  let skills = [];
  if (resumeData.skills && resumeData.skills.length > 0) {
    skills = resumeData.skills;
  } else {
    // Parse categorized skills from form
    if (form.skillLang) skills.push({ category: 'Languages', val: form.skillLang });
    if (form.skillWeb) skills.push({ category: 'Web & Frameworks', val: form.skillWeb });
    if (form.skillAI) skills.push({ category: 'Cybersecurity', val: form.skillAI });
    if (form.skillTools) skills.push({ category: 'Tools & Platforms', val: form.skillTools });
  }

  const skillsHtml = skills.length
    ? `<div style="display: flex; flex-direction: column; gap: 4px;">
        ${skills.map(s => {
          if (s.category && s.val) {
            return `<div style="font-size: 9.5pt; color: #374151;"><strong>${esc(s.category)}</strong>: ${esc(s.val)}</div>`;
          } else if (s.name) {
            return `<span class="skill-tag">${esc(s.name)}</span>`;
          } else {
            return `<span class="skill-tag">${esc(s)}</span>`;
          }
        }).join('')}
       </div>`
    : ''

  // Certifications: support structured list or parsed text.
  // Fixed: previously split on en dash "–" only, which silently swallowed the date
  // into the title whenever the form used a plain hyphen "-" instead — this is
  // what caused certification dates to go missing / unaligned.
  let certifications = resumeData.certifications || [];
  if (certifications.length === 0 && form.certifications) {
    certifications = form.certifications.split('\n').filter(l => l.trim()).map(line => {
      const { title, dateText, issuer } = splitTitleAndDate(line);
      return { title, issuer: issuer || '', issue_date: dateText, credential_url: '' };
    });
  }

  const certHtml = certifications.map(c => {
    const title = c.title || '';
    const issuer = c.issuer || '';
    const dateText = c.issue_date || c.date || '';
    const credUrl = c.credential_url || c.credentialUrl || '';
    const credId = c.credential_id || c.credentialId || '';

    const verifyLink = credUrl ? ` | <a href="${esc(credUrl)}" class="link" target="_blank">Verify</a>` : '';
    const idText = credId ? ` (ID: ${esc(credId)})` : '';

    return `
    <div class="entry">
      <div class="entry-header">
        <strong>${esc(title)}</strong>
        <span class="date">${esc(dateText)}</span>
      </div>
      ${issuer || credId || credUrl ? `<div class="entry-sub" style="font-weight: normal; color: #4b5563;">${esc(issuer)}${idText}${verifyLink}</div>` : ''}
    </div>`;
  }).join('')

  // Achievements: support structured list or parsed text (same fix as certifications)
  let achievements = resumeData.achievements || [];
  if (achievements.length === 0 && form.achievements) {
    achievements = form.achievements.split('\n').filter(l => l.trim()).map(line => {
      const { title, dateText, issuer } = splitTitleAndDate(line);
      return { title, description: issuer || '', date: dateText };
    });
  }

  const achHtml = achievements.map(a => {
    const title = a.title || '';
    const desc = a.description || '';
    const dateText = a.achievement_date || a.date || '';

    return `
    <div class="entry">
      <div class="entry-header">
        <strong>🏆 ${esc(title)}</strong>
        <span class="date">${esc(dateText)}</span>
      </div>
      ${desc ? `<p style="margin-top: 2px;">${esc(desc)}</p>` : ''}
    </div>`;
  }).join('')

  // Build ATS-friendly text-based contact line without emojis
  const contactParts = [];
  if (personal.email) contactParts.push(esc(personal.email));
  if (personal.phone) contactParts.push(esc(personal.phone));
  if (personal.location) contactParts.push(esc(personal.location));
  if (personal.linkedin) contactParts.push(esc(personal.linkedin.replace(/^https?:\/\/(www\.)?/i, '')));
  if (personal.github) contactParts.push(esc(personal.github.replace(/^https?:\/\/(www\.)?/i, '')));
  const contactLineText = contactParts.join('  |  ');

  const docTitle = personal.full_name ? `${esc(personal.full_name)} — Resume` : 'Resume'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${docTitle}</title>
<style>
  :root {
    --accent: #1f3864;
    --text: #1a1a1a;
    --text-muted: #4b5563;
    --text-sub: #374151;
    --border: #d1d5db;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: var(--text); padding: 40px 48px; line-height: 1.5; }

  .header { border-bottom: 3px solid var(--accent); padding-bottom: 10px; margin-bottom: 4px; }
  h1 { font-size: 23pt; font-weight: 700; color: var(--accent); letter-spacing: -0.01em; }
  .subtitle { font-size: 11pt; font-weight: 600; color: var(--text-muted); margin-top: 3px; text-transform: uppercase; letter-spacing: 0.05em; }
  .contact-line { font-size: 9.5pt; color: var(--text-muted); margin-top: 6px; font-weight: 500; }

  .section { margin-top: 18px; break-inside: avoid-page; }
  h2 { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); }
  .divider { border-top: 1.5px solid var(--border); margin: 4px 0 10px; }

  /* Prevent a single entry (title/date/bullets) from being split across a page break */
  .entry { margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .entry-header strong { font-size: 10.5pt; color: #111; }
  .date { font-size: 9.5pt; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
  .entry-sub { font-size: 9.5pt; color: var(--text-sub); font-weight: 600; margin-top: 1px; }

  ul { margin-top: 4px; padding-left: 18px; }
  li { font-size: 9.5pt; color: var(--text-sub); margin-bottom: 2px; }

  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #f3f4f6; padding: 2px 10px; border-radius: 4px; font-size: 9pt; border: 1px solid #e5e7eb; font-weight: 600; color: var(--text-sub); }

  a.link { font-size: 9pt; color: var(--accent); text-decoration: none; font-weight: 600; }
  p { font-size: 9.5pt; color: var(--text-sub); margin-top: 3px; }

  @media print {
    .section { break-inside: auto; } /* long sections may still span pages; only .entry avoids breaking */
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${esc(personal.full_name) || 'Your Name'}</h1>
    <div class="subtitle">${esc(personal.title)}</div>
    ${contactLineText ? `<div class="contact-line">${contactLineText}</div>` : ''}
  </div>
  ${section('Professional Summary', summaryHtml)}
  ${section('Education', eduHtml)}
  ${section('Experience', expHtml)}
  ${section('Skills', skillsHtml)}
  ${section('Projects', projHtml)}
  ${section('Certifications', certHtml)}
  ${section('Achievements', achHtml)}
</body>
</html>`
}

/**
 * Generate a PDF from resume data using Puppeteer
 * @param {object} resumeData - Full resume JSON
 * @param {boolean} saveToStorage - If true, upload to Supabase Storage
 * @returns {{ pdfBuffer: Buffer, pdfUrl?: string }}
 */
async function generateResumePdf(resumeData, saveToStorage = false) {
  const html = buildResumeHtml(resumeData)
  const executablePath = findBrowserExecutable()

  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  } catch (err) {
    if (err && err.message && err.message.includes('Could not find Chrome')) {
      throw new Error(
        "Puppeteer could not launch Chrome. " +
          "Install the browser with `npx puppeteer browsers install chrome` " +
          "or set PUPPETEER_EXECUTABLE_PATH to a valid Chrome/Chromium executable."
      )
    }
    throw err
  }

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    })

    let pdfUrl = null

    if (saveToStorage) {
      const result = await uploadFile(
        pdfBuffer,
        `resume-${Date.now()}.pdf`,
        'application/pdf',
        'resume'
      )
      pdfUrl = result.url

      // Update resume_profile with pdf_url
      await upsertResumeProfile(resumeData, pdfUrl)
    }

    return { pdfBuffer, pdfUrl }
  } finally {
    await browser.close()
  }
}

module.exports = { generateResumePdf, buildResumeHtml }