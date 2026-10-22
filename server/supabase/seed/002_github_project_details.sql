-- ============================================================
-- SEED 002 — Project details pulled from GitHub READMEs
-- Source: public READMEs of github.com/Sameal11 repositories (plus the profile
-- README for the private SecureCI and smart-lab-track repos).
--
-- Only fills EMPTY fields, so anything already written in the CMS is kept.
-- Safe to re-run. Run after migrations 001/002 (seed 001 is independent).
-- ============================================================

-- Email typo fix (address confirmed by the GitHub profile README)
UPDATE public.profiles
SET email = 'aryanrajarya11@gmail.com', updated_at = now()
WHERE email = 'aryanrajarya11@gmail.com.com';

-- NoteLock
UPDATE public.projects SET
  description  = CASE WHEN coalesce(trim(description), '') = '' THEN 'A PIN-protected notes vault with Google Keep-style colour cards, todos, tags and priorities, so organising notes feels playful instead of like admin.' ELSE description END,
  technologies = CASE WHEN coalesce(array_length(technologies, 1), 0) = 0 THEN ARRAY['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Express', 'MongoDB', 'Zod', 'Podman']::text[] ELSE technologies END,
  key_features = CASE WHEN coalesce(array_length(key_features, 1), 0) = 0 THEN ARRAY['Problem: Notes apps tend to be either pleasant but disorganised, or organised but dull, and personal notes deserve a lock.', 'What I built: A full-stack notes vault with colour-coded masonry cards (4 / 3 / 2 columns by screen size), todos inside notes, tags, priority levels, pinning and archiving.', 'Design system: 8 named note colours (coral, sky, mint, lavender…), Fredoka + Nunito type, shadcn/ui on Radix primitives, and gradient branding through CSS variables.', 'Security: 6-digit PIN hashed with bcrypt, a recovery word for restoring access, and Zod validation on every API request.', 'Deployment: Containerised with Podman and live on Render.', 'Who it helped / outcome: TODO.']::text[] ELSE key_features END,
  updated_at   = now()
WHERE lower(github_url) = lower('https://github.com/Sameal11/NoteLock');

-- SecureCI-CI-CD-Security-Scanning-Risk-Assessment
UPDATE public.projects SET
  description  = CASE WHEN coalesce(trim(description), '') = '' THEN 'Plugs into Jenkins and GitHub Actions, runs Bandit, Semgrep and OWASP ZAP on every build, and condenses three scanners into one risk score and a pass/fail report.' ELSE description END,
  technologies = CASE WHEN coalesce(array_length(technologies, 1), 0) = 0 THEN ARRAY['Python', 'Flask', 'PostgreSQL', 'Jenkins', 'GitHub Actions', 'Docker', 'Terraform', 'Ansible']::text[] ELSE technologies END,
  key_features = CASE WHEN coalesce(array_length(key_features, 1), 0) = 0 THEN ARRAY['Problem: Three security scanners produce three long reports, and someone still has to decide whether the build can ship.', 'What I built: A scanning service that ingests repos from Jenkins and GitHub Actions pipelines, runs Bandit, Semgrep and OWASP ZAP, and computes a risk score per build.', 'Automation: Every build gets a generated pass/fail report, so the decision is made by the pipeline, not by reading logs.', 'Infrastructure: Containerised with Docker; provisioned with Terraform and Ansible.', 'Who it helped / outcome: TODO.']::text[] ELSE key_features END,
  updated_at   = now()
WHERE lower(github_url) = lower('https://github.com/Sameal11/SecureCI-CI-CD-Security-Scanning-Risk-Assessment');

-- smart-lab-track
UPDATE public.projects SET
  description  = CASE WHEN coalesce(trim(description), '') = '' THEN 'SecureLab: students tap an RFID card to sign in, sessions are tracked live, and faculty see attendance, app usage and idle time in one web portal instead of on paper registers.' ELSE description END,
  technologies = CASE WHEN coalesce(array_length(technologies, 1), 0) = 0 THEN ARRAY['Node.js', 'Express', 'MongoDB', 'Redis', 'JWT', 'React', 'React Native', 'Electron', 'ESP32', 'RFID']::text[] ELSE technologies END,
  key_features = CASE WHEN coalesce(array_length(key_features, 1), 0) = 0 THEN ARRAY['Problem: Lab attendance and monitoring were manual, and faculty had no live view of what was happening in a session.', 'What I built: RFID-based student authentication (ESP32 hardware), live session tracking, application-usage logging and idle-time detection.', 'Two interfaces, two users: a desktop client (Electron) for the lab machines and a web-based portal for faculty.', 'Who it helped / outcome: TODO.']::text[] ELSE key_features END,
  updated_at   = now()
WHERE lower(github_url) = lower('https://github.com/Sameal11/smart-lab-track');

-- CyberDefenseport
UPDATE public.projects SET
  description  = CASE WHEN coalesce(trim(description), '') = '' THEN 'A cybersecurity-themed portfolio site with a terminal aesthetic: typing hero, animated skill bars and a validated contact form backed by PostgreSQL.' ELSE description END,
  technologies = CASE WHEN coalesce(array_length(technologies, 1), 0) = 0 THEN ARRAY['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Express', 'PostgreSQL', 'Drizzle ORM']::text[] ELSE technologies END,
  key_features = CASE WHEN coalesce(array_length(key_features, 1), 0) = 0 THEN ARRAY['What I built: A full-stack portfolio with a terminal/hacker visual language (matrix background, cyber-green/blue/red palette), a typing-effect hero and animated skill bars.', 'Contact flow: Form with subject selection, Zod validation and toast feedback; submissions are stored in serverless PostgreSQL (Neon) via Drizzle ORM.', 'Architecture: Monorepo with client, server and shared TypeScript schemas.', 'Links: Live at cyber-defenseport.vercel.app.']::text[] ELSE key_features END,
  live_url     = coalesce(nullif(live_url, ''), 'https://cyber-defenseport.vercel.app'),
  updated_at   = now()
WHERE lower(github_url) = lower('https://github.com/Sameal11/CyberDefenseport');

-- E-commerce
UPDATE public.projects SET
  description  = CASE WHEN coalesce(trim(description), '') = '' THEN 'A Flask + MySQL storefront with product listing, product pages, cart, wishlist and sign-in, and a home page that rotates featured products every two seconds.' ELSE description END,
  technologies = CASE WHEN coalesce(array_length(technologies, 1), 0) = 0 THEN ARRAY['Python', 'Flask', 'MySQL', 'Bootstrap', 'JavaScript', 'jQuery']::text[] ELSE technologies END,
  key_features = CASE WHEN coalesce(array_length(key_features, 1), 0) = 0 THEN ARRAY['What I built: Product listing and detail pages, a shopping cart with quantity updates, a wishlist and user authentication.', 'Data-driven: Products, images and details are all served from MySQL, and the home page refreshes its featured products every 2 seconds via AJAX.']::text[] ELSE key_features END,
  updated_at   = now()
WHERE lower(github_url) = lower('https://github.com/Sameal11/E-commerce');

-- PDF Bench (repo: pdf-tools, not previously in the CMS)
INSERT INTO public.projects (title, description, technologies, key_features, github_url, featured, visible, display_order, source)
SELECT 'PDF Bench', 'Everyday PDF jobs in one place, with no account and no file history: merge, compress, PDF → Excel, PDF → Word with OCR for scans, plus image tools that run entirely in the browser.', ARRAY['Python', 'Flask', 'Ghostscript', 'Tesseract OCR', 'Poppler', 'JavaScript', 'Gunicorn', 'Docker']::text[], ARRAY['Problem: Small document chores, like merging files, shrinking a PDF or getting a table out of one, send people to ad-heavy sites that want an account and keep their files.', 'What I built: Five focused tools, one page each: Merge (optional page numbers and watermark), Compress (toward a target size range), PDF → Excel, PDF → Word, and Image tools.', 'Automation: Table detection exports straight to .xlsx with numeric columns cleaned; scanned PDFs fall back to Tesseract OCR so they still become editable Word files.', 'Privacy by design: Image tools run in the browser; server-side uploads are deleted after processing; no accounts or file history.', 'Deployment: Gunicorn with a Dockerfile and deployment notes. TODO: the custom domain (maximux.online) is currently not responding; add the live link once it is back up.', 'Who it helped / outcome: TODO.']::text[], 'https://github.com/Sameal11/pdf-tools', true, true, 0, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE lower(github_url) = lower('https://github.com/Sameal11/pdf-tools'));

-- Claw: Research-First AI System Agent (repo: Agent, not previously in the CMS)
INSERT INTO public.projects (title, description, technologies, key_features, github_url, featured, visible, display_order, source)
SELECT 'Claw: Research-First AI System Agent', 'A self-hosted AI agent that operates a Linux machine through tools. It is built to work with a small local model by checking commands, packages and URLs against the real system before it acts.', ARRAY['Python', 'MCP', 'Claude API', 'Ollama / vLLM', 'Linux']::text[], ARRAY['Problem: Small local models misremember command flags, package names and URLs, so an agent that trusts its own memory breaks things.', 'What I built: A "research-first" agent: every shell command is checked against the installed --help, package names against this distro''s repos, and URLs must come from the user or a tool result.', 'AI / automation: An MCP server exposing 26 tools; two LLM backends (local OpenAI-compatible servers such as vLLM/Ollama, or the Claude API) switched with one environment variable; installs skills from ClawHub at runtime.', 'Safety & UX: Every state-changing action goes through one approval and audit pipeline with a hard blocklist; sudo passwords never reach the model; a readable CLI with panelled approval prompts.', 'Who it helped / outcome: TODO.']::text[], 'https://github.com/Sameal11/Agent', true, true, 0, 'manual'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE lower(github_url) = lower('https://github.com/Sameal11/Agent'));

