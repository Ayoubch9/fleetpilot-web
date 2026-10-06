-- MileVoxa Web v4.6.6 — structured sign-out beta feedback
-- Safe additive migration. Existing beta_feedback rows and policies remain intact.

alter table public.beta_feedback
  add column if not exists rating smallint null
    check (rating is null or rating between 1 and 5),
  add column if not exists feedback_tags text[] not null default '{}'::text[],
  add column if not exists feedback_kind text not null default 'general'
    check (feedback_kind in ('general','signout','milestone')),
  add column if not exists app_version text null,
  add column if not exists session_seconds integer null
    check (session_seconds is null or session_seconds >= 0);

create index if not exists beta_feedback_kind_created_idx
  on public.beta_feedback(feedback_kind, created_at desc);

create index if not exists beta_feedback_rating_created_idx
  on public.beta_feedback(rating, created_at desc)
  where rating is not null;

-- Existing RLS policy remains unchanged:
-- authenticated users may INSERT only for their own company/user context.
-- No authenticated SELECT access is added by this migration.
