-- MileVoxa Web Documents setup
-- Run once in Supabase SQL Editor.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null default current_company_id() references public.companies(id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  document_type text not null default 'Other',
  truck_id uuid null references public.trucks(id) on delete set null,
  expiration_date date null,
  storage_path text not null,
  file_name text not null,
  mime_type text null,
  file_size bigint null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Company access documents" on public.documents;
create policy "Company access documents"
on public.documents
for all
to authenticated
using (company_id = current_company_id())
with check (company_id = current_company_id());

insert into storage.buckets (id, name, public)
values ('fleet-documents', 'fleet-documents', false)
on conflict (id) do nothing;

drop policy if exists "Company document uploads" on storage.objects;
create policy "Company document uploads"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fleet-documents'
  and (storage.foldername(name))[1] = current_company_id()::text
);

drop policy if exists "Company document reads" on storage.objects;
create policy "Company document reads"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fleet-documents'
  and (storage.foldername(name))[1] = current_company_id()::text
);

drop policy if exists "Company document deletes" on storage.objects;
create policy "Company document deletes"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fleet-documents'
  and (storage.foldername(name))[1] = current_company_id()::text
);
