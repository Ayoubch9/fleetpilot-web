-- FleetPilot Web v3.7.5 — Google Social Auth owner_user_id Fix
-- Run this file in Supabase SQL Editor. It safely replaces the previous function.

drop function if exists public.complete_fleetpilot_social_onboarding(text, text);

create function public.complete_fleetpilot_social_onboarding(
  p_full_name text,
  p_company_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_name text := nullif(trim(p_full_name), '');
  v_company_name text := nullif(trim(p_company_name), '');
  v_profile_saved boolean := false;
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

  select cm.company_id
    into v_company_id
  from public.company_members cm
  where cm.user_id = v_user_id
  limit 1;

  if v_company_id is null then
    insert into public.companies (
      name,
      owner_user_id
    )
    values (
      v_company_name,
      v_user_id
    )
    returning id into v_company_id;

    insert into public.company_members (company_id, user_id, role)
    values (v_company_id, v_user_id, 'owner');
  end if;

  begin
    update public.profiles
       set full_name = v_name
     where id = v_user_id;

    if found then
      v_profile_saved := true;
    else
      begin
        insert into public.profiles (id, full_name)
        values (v_user_id, v_name)
        on conflict (id)
        do update set full_name = excluded.full_name;

        v_profile_saved := true;
      exception
        when others then
          v_profile_saved := false;
      end;
    end if;
  exception
    when others then
      v_profile_saved := false;
  end;

  return jsonb_build_object(
    'ok', true,
    'company_id', v_company_id,
    'profile_saved', v_profile_saved
  );
exception
  when others then
    raise exception using
      message = 'FleetPilot onboarding failed: ' || sqlerrm,
      detail = 'SQLSTATE ' || sqlstate,
      hint = 'Verify companies.owner_user_id and company_members accept the authenticated owner.';
end;
$$;

revoke all on function public.complete_fleetpilot_social_onboarding(text, text)
  from public;

grant execute on function public.complete_fleetpilot_social_onboarding(text, text)
  to authenticated;
