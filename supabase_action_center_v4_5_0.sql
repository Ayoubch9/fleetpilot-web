-- MileVoxa Web v4.5.0 — Action Center interaction state
-- Run once in Supabase SQL Editor before using Snooze/Acknowledge controls.
-- Business alerts remain derived from source records; this table stores only user interaction state.

create table if not exists public.action_alert_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid not null default current_company_id() references public.companies(id) on delete cascade,
  alert_key text not null,
  source_type text not null,
  source_id text not null,
  status text not null default 'active' check (status in ('active','snoozed','acknowledged','dismissed')),
  snoozed_until timestamptz null,
  acknowledged_at timestamptz null,
  dismissed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, company_id, alert_key)
);

create index if not exists action_alert_states_user_company_idx
  on public.action_alert_states(user_id, company_id, updated_at desc);

alter table public.action_alert_states enable row level security;

revoke all on table public.action_alert_states from anon;
grant select, insert, update, delete on table public.action_alert_states to authenticated;
grant all on table public.action_alert_states to service_role;

drop policy if exists "Users manage own company alert state" on public.action_alert_states;
create policy "Users manage own company alert state"
on public.action_alert_states
for all
to authenticated
using (
  user_id = auth.uid()
  and company_id = current_company_id()
)
with check (
  user_id = auth.uid()
  and company_id = current_company_id()
);
