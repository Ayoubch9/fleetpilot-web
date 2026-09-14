-- FleetPilot Web v3.0.2 — Mobile-style reimbursement model
-- Run once in Supabase SQL Editor BEFORE using standalone reimbursements.

alter table public.reimbursements
  alter column expense_id drop not null;

alter table public.reimbursements
  add column if not exists truck_id uuid null references public.trucks(id) on delete set null,
  add column if not exists category text null,
  add column if not exists reference text null;

-- Existing RLS/company scoping remains unchanged.
-- expense_id is now optional:
--   linked reimbursement  -> expense_id has a value
--   standalone reimbursement -> expense_id is null and category/truck/reference
--                               may be stored directly on the reimbursement.
