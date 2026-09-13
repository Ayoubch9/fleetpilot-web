-- FleetPilot Web v2.5.0 — company-level trial/subscription storage
-- Run once in Supabase SQL Editor.
-- Existing companies receive a 14-day trial beginning when this migration is run.
-- New companies automatically receive a 14-day trial.

alter table public.billing_customers
  add column if not exists plan_name text not null default 'FleetPilot Pro',
  add column if not exists trial_started_at timestamptz null,
  add column if not exists trial_ends_at timestamptz null;

insert into public.billing_customers (
  company_id,
  subscription_status,
  plan_name,
  trial_started_at,
  trial_ends_at
)
select
  c.id,
  'trialing',
  'FleetPilot Pro',
  now(),
  now() + interval '14 days'
from public.companies c
where not exists (
  select 1
  from public.billing_customers bc
  where bc.company_id = c.id
);

update public.billing_customers
set
  plan_name = coalesce(plan_name, 'FleetPilot Pro'),
  trial_started_at = coalesce(trial_started_at, created_at, now()),
  trial_ends_at = coalesce(
    trial_ends_at,
    coalesce(trial_started_at, created_at, now()) + interval '14 days'
  ),
  subscription_status = case
    when subscription_status in ('inactive', '') then 'trialing'
    else subscription_status
  end
where trial_started_at is null
   or trial_ends_at is null
   or plan_name is null
   or subscription_status in ('inactive', '');

create or replace function public.create_company_billing_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.billing_customers (
    company_id,
    subscription_status,
    plan_name,
    trial_started_at,
    trial_ends_at
  )
  values (
    new.id,
    'trialing',
    'FleetPilot Pro',
    now(),
    now() + interval '14 days'
  )
  on conflict (company_id) do nothing;

  return new;
end;
$$;

drop trigger if exists companies_create_billing_trial on public.companies;

create trigger companies_create_billing_trial
after insert on public.companies
for each row
execute function public.create_company_billing_trial();

-- Existing SELECT policy remains valid:
-- "Company reads billing status"
