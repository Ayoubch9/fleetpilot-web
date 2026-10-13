-- MileVoxa Web — business role and signup carrier identifiers.
-- Run after the base profiles / companies schema exists. Existing company
-- membership permissions remain unchanged; business_role is personal profile data.

alter table public.profiles
  add column if not exists business_role text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_business_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_business_role_check
      check (
        business_role is null
        or business_role in (
          'Owner Operator',
          'Lease Contractor',
          'Company Driver',
          'Fleet Owner',
          'Dispatcher',
          'Other'
        )
      );
  end if;
end;
$$;

alter table public.companies
  add column if not exists dot_number text null,
  add column if not exists mc_number text null;

-- A separate overload keeps the existing two-argument onboarding RPC intact
-- for already shipped clients. This function can only act for auth.uid().
create or replace function public.complete_fleetpilot_social_onboarding(
  p_full_name text,
  p_company_name text,
  p_business_role text,
  p_dot_number text,
  p_mc_number text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_membership_role text;
  v_membership_count integer;
  v_name text := nullif(trim(p_full_name), '');
  v_company_name text := nullif(trim(p_company_name), '');
  v_business_role text := nullif(trim(p_business_role), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_name is null or v_company_name is null then
    raise exception 'Full name and company name are required';
  end if;

  if v_business_role is null or v_business_role not in (
    'Owner Operator', 'Lease Contractor', 'Company Driver',
    'Fleet Owner', 'Dispatcher', 'Other'
  ) then
    raise exception 'Select a valid business role';
  end if;

  select count(*)
    into v_membership_count
  from public.company_members cm
  where cm.user_id = v_user_id;

  if v_membership_count > 1 then
    raise exception 'Multiple company memberships require company selection';
  end if;

  if v_membership_count = 1 then
    select cm.company_id, cm.role
      into v_company_id, v_membership_role
    from public.company_members cm
    where cm.user_id = v_user_id;
  end if;

  if v_company_id is null then
    insert into public.companies (
      name, owner_user_id, dot_number, mc_number
    )
    values (
      v_company_name,
      v_user_id,
      nullif(trim(p_dot_number), ''),
      nullif(trim(p_mc_number), '')
    )
    returning id into v_company_id;

    insert into public.company_members (company_id, user_id, role)
    values (v_company_id, v_user_id, 'owner');
  elsif lower(coalesce(v_membership_role, '')) = 'owner' then
    update public.companies
       set name = v_company_name,
           dot_number = nullif(trim(p_dot_number), ''),
           mc_number = nullif(trim(p_mc_number), '')
     where id = v_company_id;
  end if;

  insert into public.profiles (id, full_name, business_role)
  values (v_user_id, v_name, v_business_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        business_role = excluded.business_role;

  return jsonb_build_object(
    'ok', true,
    'company_id', v_company_id,
    'profile_saved', true
  );
end;
$$;

revoke all on function public.complete_fleetpilot_social_onboarding(
  text, text, text, text, text
) from public;

grant execute on function public.complete_fleetpilot_social_onboarding(
  text, text, text, text, text
) to authenticated;
