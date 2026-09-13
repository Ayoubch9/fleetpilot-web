-- FleetPilot Web v2.6.0 — company profile + richer user preferences
-- Run once in Supabase SQL Editor.

alter table public.companies
  add column if not exists legal_name text null,
  add column if not exists dot_number text null,
  add column if not exists mc_number text null,
  add column if not exists phone text null,
  add column if not exists email text null,
  add column if not exists address_line1 text null,
  add column if not exists address_line2 text null,
  add column if not exists city text null,
  add column if not exists state text null,
  add column if not exists postal_code text null,
  add column if not exists country text not null default 'United States',
  add column if not exists timezone text not null default 'America/New_York';

alter table public.user_preferences
  add column if not exists time_format text not null default '12-hour',
  add column if not exists week_start text not null default 'Monday',
  add column if not exists default_period text not null default 'Week',
  add column if not exists timezone text not null default 'America/New_York',
  add column if not exists compact_tables boolean not null default false;

-- Existing company/user RLS policies continue to apply.
-- No anonymous policies are added.
