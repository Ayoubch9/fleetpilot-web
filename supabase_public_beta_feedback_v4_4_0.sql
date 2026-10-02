-- MileVoxa Web v4.4.0 — Public Beta feedback storage
-- Run once in Supabase SQL Editor.
-- This migration does not alter billing or subscription records.

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null check (category in ('Bug','Suggestion','Confusing experience','Other')),
  message text not null check (char_length(message) between 5 and 5000),
  page_context text null check (page_context is null or char_length(page_context) <= 300),
  may_contact boolean not null default false,
  source text not null default 'web' check (source in ('web','mobile','admin')),
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_company_created_idx
  on public.beta_feedback(company_id, created_at desc);
create index if not exists beta_feedback_category_created_idx
  on public.beta_feedback(category, created_at desc);

alter table public.beta_feedback enable row level security;

revoke all on table public.beta_feedback from anon;
revoke select, update, delete on table public.beta_feedback from authenticated;
grant insert on table public.beta_feedback to authenticated;
grant all on table public.beta_feedback to service_role;

drop policy if exists "Authenticated users submit company feedback" on public.beta_feedback;
create policy "Authenticated users submit company feedback"
on public.beta_feedback
for insert
to authenticated
with check (
  user_id = auth.uid()
  and company_id = current_company_id()
);

-- There is intentionally no authenticated SELECT policy.
-- Feedback review remains restricted to privileged server/admin access
-- (service role / Supabase project administrators) until a dedicated admin UI
-- with its own authorization model is implemented.
