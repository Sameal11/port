-- ============================================================
-- PORTFOLIO CMS — MIGRATION 002
-- Run this in your Supabase project SQL Editor
-- Adds credential_id column to certifications table
-- ============================================================

ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS credential_id text DEFAULT NULL;
