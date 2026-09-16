-- FleetPilot Web v3.7.0 — Social Auth Onboarding
-- Run once after Google/Apple providers are configured in Supabase Auth.
--
-- This function creates the FleetPilot company and owner membership for
-- authenticated social-login users who do not already belong to a company.
-- It uses auth.uid() only; callers cannot provision another user's account.

create or replace function public.complete_fleetpilot_social_onboarding(
  p_full_name text,
  p_company_name text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_name text := nullif(trim(p_full_name), '');
  v_company_name text := nullif(trim(p_company_name), '');
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if v_name is null then
    raise exception 'Full name is required';
  end if;

  if v_company_name is null then
    raise exception 'Company name is required';
  end if;

  -- Idempotency: never create a second company when onboarding is retried.
  select cm.company_id
    into v_company_id
  from public.company_members cm
  where cm.user_id = v_user_id
  limit 1;

  if v_company_id is not null then
    insert into public.profiles (id, full_name)
    values (v_user_id, v_name)
    on conflict (id)
    do update set full_name = excluded.full_name;

    return true;
  end if;

  insert into public.profiles (id, full_name)
  values (v_user_id, v_name)
  on conflict (id)
  do update set full_name = excluded.full_name;

  insert into public.companies (name)
  values (v_company_name)
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, v_user_id, 'owner');

  return true;
end;
$$;

revoke all on function public.complete_fleetpilot_social_onboarding(text, text)
  from public;

grant execute on function public.complete_fleetpilot_social_onboarding(text, text)
  to authenticated;
