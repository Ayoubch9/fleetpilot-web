-- FleetPilot Security Deposit / Holdback System
-- v3.6.0
--
-- Tracks company-held money separately from operating expenses.
-- HOLD increases money owed back to the operator.
-- RETURN decreases money owed back.
-- ADJUSTMENT can increase or decrease the balance.
--
-- This data is company-scoped and intended to be shared by Web and Mobile.

create extension if not exists pgcrypto;

create table if not exists public.security_deposit_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  target_amount numeric(12,2) not null default 0,
  hold_method text not null default 'MANUAL'
    check (hold_method in ('WEEKLY', 'ONE_TIME', 'MANUAL')),
  weekly_amount numeric(12,2) not null default 0,
  start_date date null,
  expected_release_date date null,
  status text not null default 'HOLDING'
    check (status in ('HOLDING', 'PARTIALLY_RETURNED', 'FULLY_RETURNED', 'CLOSED')),
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.security_deposit_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  truck_id uuid null references public.trucks(id) on delete set null,
  transaction_date date not null default current_date,
  transaction_type text not null
    check (transaction_type in ('HOLD', 'RETURN', 'ADJUSTMENT')),
  adjustment_direction text null
    check (adjustment_direction in ('INCREASE', 'DECREASE')),
  amount numeric(12,2) not null check (amount >= 0),
  description text null,
  reference text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint security_deposit_adjustment_direction_check
    check (
      (transaction_type = 'ADJUSTMENT' and adjustment_direction is not null)
      or
      (transaction_type <> 'ADJUSTMENT' and adjustment_direction is null)
    )
);

create index if not exists security_deposit_transactions_company_date_idx
  on public.security_deposit_transactions(company_id, transaction_date desc);

create index if not exists security_deposit_transactions_truck_idx
  on public.security_deposit_transactions(truck_id);

alter table public.security_deposit_settings enable row level security;
alter table public.security_deposit_transactions enable row level security;

drop policy if exists "company members manage security deposit settings"
  on public.security_deposit_settings;
create policy "company members manage security deposit settings"
  on public.security_deposit_settings
  for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

drop policy if exists "company members manage security deposit transactions"
  on public.security_deposit_transactions;
create policy "company members manage security deposit transactions"
  on public.security_deposit_transactions
  for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Keep updated_at current without requiring client code.
create or replace function public.set_security_deposit_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists security_deposit_settings_updated_at
  on public.security_deposit_settings;
create trigger security_deposit_settings_updated_at
before update on public.security_deposit_settings
for each row execute function public.set_security_deposit_updated_at();

drop trigger if exists security_deposit_transactions_updated_at
  on public.security_deposit_transactions;
create trigger security_deposit_transactions_updated_at
before update on public.security_deposit_transactions
for each row execute function public.set_security_deposit_updated_at();
