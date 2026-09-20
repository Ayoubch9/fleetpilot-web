-- MileVoxa Web v1.5.0 product-layer setup
-- Run once in Supabase SQL Editor.

create table if not exists public.billing_customers (
  company_id uuid primary key references public.companies(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text not null default 'inactive',
  current_period_end timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_customers enable row level security;

drop policy if exists "Company reads billing status" on public.billing_customers;
create policy "Company reads billing status"
on public.billing_customers
for select
to authenticated
using (company_id = current_company_id());

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text null,
  reason text null,
  status text not null default 'pending'
    check (status in ('pending','cancelled','completed')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users read own deletion requests" on public.account_deletion_requests;
create policy "Users read own deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users create own deletion requests" on public.account_deletion_requests;
create policy "Users create own deletion requests"
on public.account_deletion_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
  and company_id = current_company_id()
);
