-- MileVoxa Web v1.6.0 Settings setup
-- Run once in Supabase SQL Editor.

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null default current_company_id() references public.companies(id) on delete cascade,
  language text not null default 'English',
  currency text not null default 'USD',
  date_format text not null default 'MMM d, yyyy',
  distance_unit text not null default 'Miles',
  notify_load_updates boolean not null default true,
  notify_maintenance boolean not null default true,
  notify_weekly_summary boolean not null default true,
  notify_product_updates boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "Users read own preferences" on public.user_preferences;
create policy "Users read own preferences"
on public.user_preferences
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users insert own preferences" on public.user_preferences;
create policy "Users insert own preferences"
on public.user_preferences
for insert
to authenticated
with check (
  user_id = auth.uid()
  and company_id = current_company_id()
);

drop policy if exists "Users update own preferences" on public.user_preferences;
create policy "Users update own preferences"
on public.user_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and company_id = current_company_id()
);
