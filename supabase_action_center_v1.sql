-- Review against the deployed schema, then apply in staging before production.
-- Existing business tables/policies are untouched. This contains interaction
-- metadata only; alerts themselves are derived on authenticated reads.
begin;
create table if not exists public.action_center_interactions (
  company_id uuid not null default public.current_company_id() references public.companies(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  alert_key text not null check (char_length(alert_key) between 1 and 240),
  source text not null check (source in ('maintenance','documents','expenses','settlement')),
  truck_id uuid null,
  fingerprint text not null check (char_length(fingerprint) <= 512),
  action text not null check (action in ('snooze','acknowledge','dismiss')),
  snoozed_until timestamptz null,
  updated_at timestamptz not null default now(),
  resolved_at timestamptz null,
  primary key (company_id,user_id,alert_key),
  check (alert_key like source || ':%'),
  check ((action = 'snooze') = (snoozed_until is not null)),
  check (snoozed_until is null or snoozed_until <= updated_at + interval '30 days')
);
alter table public.action_center_interactions enable row level security;
revoke all on public.action_center_interactions from anon;
grant select,insert,update,delete on public.action_center_interactions to authenticated;
drop policy if exists "Own company alert interactions" on public.action_center_interactions;
create policy "Own company alert interactions" on public.action_center_interactions
for all to authenticated
using (user_id = auth.uid() and company_id = public.current_company_id()
  and exists (select 1 from public.company_members m where m.user_id = auth.uid() and m.company_id = action_center_interactions.company_id))
with check (user_id = auth.uid() and company_id = public.current_company_id()
  and exists (select 1 from public.company_members m where m.user_id = auth.uid() and m.company_id = action_center_interactions.company_id));
create index if not exists action_center_interactions_recent_idx on public.action_center_interactions(company_id,user_id,updated_at desc);
commit;
