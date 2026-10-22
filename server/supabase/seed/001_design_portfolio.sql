-- ============================================================
-- SEED 001 — Design / AI-generalist portfolio content
-- Run AFTER migrations 001 and 002, in the Supabase SQL Editor.
--
-- Safe to re-run: each project is inserted only if no project with the same
-- title exists yet. Everything here stays editable in the CMS (/admin).
--
-- Content rules followed:
--   * Only projects you listed. Nothing invented: no metrics, no vehicle work.
--   * Every "TODO:" is a gap only you can fill (outcomes, numbers, links,
--     screenshots). Search the CMS for "TODO" before sharing the site.
--   * key_features carries the case-study structure shown on each project's
--     detail page: Problem → What I built → AI/automation → Outcome → Stack → Links.
-- ============================================================

-- ── Positioning (hero + about) ──────────────────────────────
UPDATE public.profiles
SET
  title      = 'Tools, dashboards & AI workflows',
  tagline    = 'Engineer who builds tools, dashboards and AI workflows that make complex work simple for the people doing it.',
  bio        = 'B.Tech CSE student at SRM Institute of Science and Technology. I look for the friction in how people work, like a file that won''t convert or a report nobody reads, and build small, deployed tools that remove it, using Python, JavaScript and LLMs. I care about the interface as much as the code: studying design systems and reviewing UX are part of how I build.',
  updated_at = now()
WHERE id = (SELECT id FROM public.profiles LIMIT 1);

-- TODO: the stored email currently ends in ".com.com". Fix it in CMS → Profile,
-- or uncomment and correct this line:
-- UPDATE public.profiles SET email = 'you@example.com' WHERE id = (SELECT id FROM public.profiles LIMIT 1);

-- ── Projects ────────────────────────────────────────────────
INSERT INTO public.projects
  (title, description, technologies, key_features, featured, visible, display_order, source, image_url, github_url, live_url)
SELECT v.title, v.description, v.technologies, v.key_features, v.featured, true, v.display_order, 'manual', NULL, NULL, NULL
FROM (VALUES
  (
    'DocForge',
    'An offline file converter with AI document intelligence: convert files without uploading them anywhere, then ask questions about what is inside.',
    ARRAY['Python', 'LLM', 'TODO: confirm stack'],
    ARRAY[
      'Problem: Converting documents usually means uploading them to an online tool, and understanding a long document still means reading all of it. TODO: describe who hit this and when.',
      'What I built: An offline converter with an AI layer that reads the converted document and answers questions about it. TODO: list supported formats.',
      'AI / automation: TODO: model used, and what it extracts or summarises.',
      'Who it helped / outcome: TODO: users and a real result (time saved, files handled). No estimates.',
      'Links: TODO: repo / demo / screenshots.'
    ],
    true, 1
  ),
  (
    'Claude Plugin Orchestration Sandbox',
    'A sandbox for chaining LLM tool calls into workflows: one request can trigger several tools in sequence, each step visible and debuggable.',
    ARRAY['Claude API', 'Tool use', 'TODO: confirm stack'],
    ARRAY[
      'Problem: Multi-step tasks with an LLM fall apart when every step is a separate manual prompt. TODO: the concrete task you were automating.',
      'What I built: An orchestration sandbox where the model calls tools and passes results between them. TODO: list the tools / plugins.',
      'AI / automation: LLM tool use and workflow chaining.',
      'Who it helped / outcome: TODO: what it made faster or possible.',
      'Links: TODO: repo / demo video.'
    ],
    true, 2
  ),
  (
    'MBV Analyst Workspace',
    'A Streamlit dashboard that turns raw reports into visual insight, so analysts can see the pattern instead of scrolling through tables.',
    ARRAY['Python', 'Streamlit', 'TODO: confirm stack'],
    ARRAY[
      'Problem: Raw reports were hard to read and slow to turn into decisions. TODO: who used them and what the reports were.',
      'What I built: A Streamlit workspace that ingests the reports and presents them as interactive charts and summaries.',
      'AI / automation: TODO: automated parsing or AI summaries, if any. Delete this line if none.',
      'Who it helped / outcome: TODO: the analysts it served and what changed for them.',
      'Links: TODO: repo / deployed app / screenshots.'
    ],
    true, 3
  ),
  (
    'Design Systems Case Study',
    'A comparative study of Material 3, Apple HIG, Fluent, Carbon and Atomic Design, and of what separates genuinely human-centered UI from "human-washed" UI.',
    ARRAY['Design systems', 'UX research', 'Material 3', 'HIG', 'Fluent', 'Carbon'],
    ARRAY[
      'Problem: Design systems look alike on the surface. The useful differences sit in their principles and trade-offs.',
      'What I built: A structured comparison of Material 3, HIG, Fluent, Carbon and Atomic Design, plus a framework for spotting "human-washed" UI that only looks human-centered.',
      'AI / automation: TODO: if AI helped with research or synthesis, say how. Otherwise delete this line.',
      'Who it helped / outcome: TODO: where you applied it (e.g. the UX checklist, this portfolio).',
      'Links: TODO: link the write-up / PDF.'
    ],
    true, 4
  ),
  (
    '20-Point UX Review Checklist',
    'A process artifact: the 20-point checklist I run on interfaces before calling them done, covering accessibility, states, consistency and microcopy.',
    ARRAY['UX review', 'Accessibility', 'Process design'],
    ARRAY[
      'Problem: Reviews without a checklist catch whatever the reviewer happens to notice and miss the rest.',
      'What I built: A repeatable 20-point checklist for reviewing UI. TODO: list the categories, or link the full checklist.',
      'AI / automation: TODO: if you run it with an AI assistant or script, describe that. Otherwise delete this line.',
      'Who it helped / outcome: TODO: a project where it caught real issues.',
      'Links: TODO: link the checklist.'
    ],
    true, 5
  ),
  (
    'MSA SRM Website Rebuild + Sponsors Brochure',
    'Rebuilt the MSA SRM website and designed the sponsors brochure: one project spanning web build and print design.',
    ARRAY['Web', 'Print design', 'TODO: confirm stack'],
    ARRAY[
      'Problem: TODO: what was wrong with the old site, and what sponsors needed to see.',
      'What I built: A rebuilt website and a sponsors brochure. TODO: your role and scope.',
      'AI / automation: TODO: if any. Otherwise delete this line.',
      'Who it helped / outcome: TODO: the club, sponsors, any real result.',
      'Links: TODO: live site / brochure PDF / screenshots.'
    ],
    true, 6
  ),
  (
    'Packaged AI Skills',
    'Reusable AI skills packaged for repeat use, including a design-reference skill and a resume builder.',
    ARRAY['LLM', 'Prompt engineering', 'Automation'],
    ARRAY[
      'Problem: Good AI workflows get rebuilt from scratch every time instead of being reused.',
      'What I built: Packaged skills, including a design-reference skill and a resume builder. TODO: what each one does.',
      'AI / automation: Packaged LLM skills.',
      'Who it helped / outcome: TODO.',
      'Links: TODO.'
    ],
    false, 7
  ),
  (
    'SoundSelf',
    'A Spotify personality analyzer that turns listening history into a readable personality profile.',
    ARRAY['Spotify API', 'TODO: confirm stack'],
    ARRAY[
      'Problem: Listening data is rich but unreadable as raw numbers.',
      'What I built: An analyzer that maps Spotify listening data to a personality profile. TODO: how the mapping works.',
      'AI / automation: TODO: if any.',
      'Who it helped / outcome: TODO.',
      'Links: TODO.'
    ],
    false, 8
  ),
  (
    'Visual Work: Brochures & AI-Generated Festival Content',
    'Print and visual design, including the TECH HEIST tri-fold brochure and AI image-generation content for festival campaigns.',
    ARRAY['Graphic design', 'Print', 'AI image generation'],
    ARRAY[
      'Problem: TODO: what the event needed to communicate.',
      'What I built: The TECH HEIST tri-fold brochure and festival visuals made with AI image generation.',
      'AI / automation: AI image generation. TODO: tools used and how you directed them.',
      'Who it helped / outcome: TODO.',
      'Links: TODO: upload images via CMS → Media and set the cover image.'
    ],
    false, 9
  )
) AS v(title, description, technologies, key_features, featured, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.projects p WHERE lower(p.title) = lower(v.title)
);

-- ── Vehicle / industrial design ─────────────────────────────
-- Intentionally empty. Add a real vehicle or industrial-design project through
-- the CMS if you have one. Do not add placeholder vehicle work.

-- ── Optional: let the new design-focused work lead ──────────
-- GitHub-synced repos currently featured (SecureCI, smart-lab-track, NoteLock)
-- will appear alongside these. To feature only the seeded projects, uncomment:
-- UPDATE public.projects SET featured = false WHERE source = 'github';
