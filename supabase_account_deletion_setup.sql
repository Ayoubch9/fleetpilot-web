-- FleetPilot Web v3.8.0
-- Legal/account deletion + deleted Google account handling
--
-- Run once in Supabase SQL Editor.
--
-- Important behavior:
-- 1. A self-deleted account is removed from auth.users.
-- 2. A small tombstone containing the normalized email is retained so a
--    later Google OAuth sign-in does NOT silently recreate FleetPilot data.
-- 3. The returning user may explicitly choose to create a brand-new blank
--    FleetPilot account, which removes the tombstone and sends them through
--    onboarding again.
--
-- The tombstone is intentionally NOT exposed with normal table RLS.
-- Authenticated users interact only through the security-definer functions.

create extension if not exists pgcrypto;

create table if not exists public.fleetpilot_deleted_accounts (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null unique,
  previous_user_id uuid null,
  previous_company_id uuid null,
  provider text null,
  reason text null,
  deleted_at timestamptz not null default now()
);

alter table public.fleetpilot_deleted_accounts enable row level security;

revoke all on table public.fleetpilot_deleted_accounts from anon;
revoke all on table public.fleetpilot_deleted_accounts from authenticated;

create index if not exists fleetpilot_deleted_accounts_deleted_at_idx
  on public.fleetpilot_deleted_accounts(deleted_at desc);


-- Returns true when the currently authenticated email belongs to a
-- previously deleted FleetPilot account.
create or replace function public.is_fleetpilot_deleted_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select lower(trim(u.email))
    into v_email
  from auth.users u
  where u.id = auth.uid();

  if v_email is null then
    return false;
  end if;

  return exists (
    select 1
    from public.fleetpilot_deleted_accounts d
    where d.email_normalized = v_email
  );
end;
$$;

revoke all on function public.is_fleetpilot_deleted_account() from public;
grant execute on function public.is_fleetpilot_deleted_account()
  to authenticated;


-- Explicitly lets a returning deleted user start a completely new,
-- blank FleetPilot account. Old business data is not restored.
create or replace function public.reactivate_fleetpilot_deleted_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select lower(trim(u.email))
    into v_email
  from auth.users u
  where u.id = auth.uid();

  if v_email is null then
    raise exception 'Authenticated account has no email address';
  end if;

  delete from public.fleetpilot_deleted_accounts
  where email_normalized = v_email;

  return true;
end;
$$;

revoke all on function public.reactivate_fleetpilot_deleted_account()
  from public;
grant execute on function public.reactivate_fleetpilot_deleted_account()
  to authenticated;


-- Permanent self-service deletion.
--
-- Company owners may delete the company only when they are the sole member.
-- This prevents an owner from accidentally destroying another member's data.
-- Non-owner members delete only their own membership/account.
create or replace function public.delete_my_fleetpilot_account(
  p_confirmation text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_provider text;
  v_company_id uuid;
  v_role text;
  v_member_count integer := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if trim(coalesce(p_confirmation, '')) <> 'DELETE' then
    raise exception 'Type DELETE exactly to confirm account deletion';
  end if;

  select
    lower(trim(u.email)),
    coalesce(
      u.raw_app_meta_data ->> 'provider',
      u.raw_user_meta_data ->> 'provider',
      'email'
    )
  into v_email, v_provider
  from auth.users u
  where u.id = v_user_id;

  if v_email is null then
    raise exception 'Could not determine the authenticated email address';
  end if;

  select cm.company_id, lower(coalesce(cm.role, 'member'))
    into v_company_id, v_role
  from public.company_members cm
  where cm.user_id = v_user_id
  limit 1;

  if v_company_id is not null then
    select count(*)
      into v_member_count
    from public.company_members cm
    where cm.company_id = v_company_id;
  end if;

  if v_role = 'owner' and v_member_count > 1 then
    raise exception
      'This company still has other members. Transfer ownership or remove the other members before deleting the owner account.';
  end if;

  insert into public.fleetpilot_deleted_accounts (
    email_normalized,
    previous_user_id,
    previous_company_id,
    provider,
    reason,
    deleted_at
  )
  values (
    v_email,
    v_user_id,
    v_company_id,
    v_provider,
    nullif(trim(coalesce(p_reason, '')), ''),
    now()
  )
  on conflict (email_normalized)
  do update set
    previous_user_id = excluded.previous_user_id,
    previous_company_id = excluded.previous_company_id,
    provider = excluded.provider,
    reason = excluded.reason,
    deleted_at = excluded.deleted_at;

  -- If the current user owns the company and is the only member, delete the
  -- company first so company-scoped records can cascade before auth deletion.
  if v_company_id is not null and v_role = 'owner' then
    delete from public.companies
    where id = v_company_id;
  elsif v_company_id is not null then
    delete from public.company_members
    where user_id = v_user_id
      and company_id = v_company_id;
  end if;

  -- Legacy pending request, if present.
  begin
    delete from public.account_deletion_requests
    where user_id = v_user_id;
  exception
    when undefined_table then
      null;
  end;

  -- Profile/preferences are normally auth-user cascades, but explicit cleanup
  -- makes the intention clear for older schemas.
  begin
    delete from public.user_preferences where user_id = v_user_id;
  exception
    when undefined_table then
      null;
  end;

  begin
    delete from public.profiles where id = v_user_id;
  exception
    when undefined_table then
      null;
  end;

  -- Created by SQL editor owner; the SECURITY DEFINER function can remove
  -- the current auth user without exposing a service-role key to the client.
  delete from auth.users
  where id = v_user_id;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'deleted_at', now()
  );
exception
  when others then
    raise exception using
      message = 'FleetPilot account deletion failed: ' || sqlerrm,
      detail = 'SQLSTATE ' || sqlstate,
      hint = 'Review company ownership/member dependencies or foreign-key constraints before retrying.';
end;
$$;

revoke all on function public.delete_my_fleetpilot_account(text, text)
  from public;
grant execute on function public.delete_my_fleetpilot_account(text, text)
  to authenticated;
