-- ============================================================================
-- NFC Digital Business Card Platform – Supabase Schema
-- File: supabase/migrations/001_create_profiles.sql
--
-- Run this SQL in your Supabase project:
--   Dashboard → SQL Editor → New Query → Paste & Run
--   OR use the Supabase CLI: supabase db push
-- ============================================================================

-- Enable the pgcrypto extension for gen_random_uuid() (usually pre-enabled)
create extension if not exists "pgcrypto";

-- ─── profiles table ──────────────────────────────────────────────────────────

create table if not exists public.profiles (

  -- Primary key: auto-generated UUID
  id            uuid          primary key default gen_random_uuid(),

  -- URL slug – must be unique and URL-safe (enforced at app level via slugify)
  -- Example: 'hotel-skylight' → your-domain.com/p/hotel-skylight
  slug          text          not null unique,

  -- Entity type – drives UI rendering logic in Next.js
  -- Extend the check constraint as you add more types to the platform
  profile_type  text          not null default 'individual'
                  check (profile_type in ('individual', 'business', 'restaurant', 'hotel', 'legal')),

  -- Display name (person name or business name)
  name          text          not null,

  -- Short bio, tagline, or description
  bio           text,

  -- Public URL to avatar, logo, or profile picture
  avatar_url    text,

  -- ── JSONB columns (flexible, schema-less sub-documents) ──────────────────

  -- Contact details: { email, phone, address, maps_url, website }
  contact_info  jsonb         default '{}',

  -- Social platform links: [{ platform, url, icon }]
  -- e.g. [{"platform":"LinkedIn","url":"https://linkedin.com/in/john"}]
  social_links  jsonb         default '[]',

  -- Custom/extra links: [{ title, url, description }]
  -- e.g. [{"title":"Book a Room","url":"https://hotel.com/book"}]
  custom_links  jsonb         default '[]',

  -- Audit timestamp – auto-set on insert, never changes
  created_at    timestamptz   not null default now()

);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- The slug column is already indexed via the UNIQUE constraint.
-- Add a GIN index on JSONB columns if you plan to query inside them:

-- Index for filtering/searching within contact_info (optional)
create index if not exists idx_profiles_contact_info
  on public.profiles using gin (contact_info);

-- Index for filtering/searching within social_links (optional)
create index if not exists idx_profiles_social_links
  on public.profiles using gin (social_links);

-- Index for sorting by profile_type
create index if not exists idx_profiles_type
  on public.profiles (profile_type);

-- Index for sorting by creation date (used in getAllProfiles)
create index if not exists idx_profiles_created_at
  on public.profiles (created_at desc);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────

-- Enable RLS to protect the table
alter table public.profiles enable row level security;

-- ── Public read policy ────────────────────────────────────────────────────────
-- Anyone (including unauthenticated visitors) can read profiles.
-- This powers the public /p/[slug] profile pages.
create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- ── Authenticated write policies ─────────────────────────────────────────────
-- Only authenticated users can insert/update/delete their own profiles.
-- Assumes a user_id column would link profiles to auth.users.
-- For now, we allow any authenticated user to create profiles.
-- TODO: Add a `user_id uuid references auth.users(id)` column and scope
--       update/delete policies to `auth.uid() = user_id`.

create policy "Authenticated users can create profiles"
  on public.profiles
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update profiles"
  on public.profiles
  for update
  to authenticated
  using (true);

create policy "Authenticated users can delete profiles"
  on public.profiles
  for delete
  to authenticated
  using (true);

-- ─── Comments ────────────────────────────────────────────────────────────────

comment on table  public.profiles               is 'NFC Digital Business Card profiles – one row per card/entity.';
comment on column public.profiles.id            is 'Auto-generated UUID primary key.';
comment on column public.profiles.slug          is 'URL-safe unique identifier used in /p/[slug] routes.';
comment on column public.profiles.profile_type  is 'Entity type: individual | business | restaurant | hotel | legal.';
comment on column public.profiles.name          is 'Display name of the person or business.';
comment on column public.profiles.bio           is 'Short bio, tagline, or description.';
comment on column public.profiles.avatar_url    is 'Public URL to profile picture or logo.';
comment on column public.profiles.contact_info  is 'JSONB: { email, phone, address, maps_url, website }.';
comment on column public.profiles.social_links  is 'JSONB array: [{ platform, url, icon }].';
comment on column public.profiles.custom_links  is 'JSONB array: [{ title, url, description }].';
comment on column public.profiles.created_at    is 'Timestamp of record creation (UTC).';
