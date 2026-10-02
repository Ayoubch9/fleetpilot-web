create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references public.companies(id) on delete cascade,
  name text not null,
  created_by uuid null default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(company_id, name)
);
alter table public.document_folders enable row level security;
drop policy if exists "Company access document folders" on public.document_folders;
create policy "Company access document folders" on public.document_folders
for all to authenticated
using (company_id = current_company_id())
with check (company_id = current_company_id());

alter table public.documents
  add column if not exists folder_id uuid null references public.document_folders(id) on delete set null,
  add column if not exists jurisdiction text null,
  add column if not exists issue_date date null,
  add column if not exists effective_date date null,
  add column if not exists document_number text null,
  add column if not exists carry_in_truck boolean not null default false,
  add column if not exists notes text null;

create index if not exists documents_company_truck_idx on public.documents(company_id, truck_id);
create index if not exists documents_expiration_idx on public.documents(company_id, expiration_date);
create index if not exists documents_folder_idx on public.documents(company_id, folder_id);
