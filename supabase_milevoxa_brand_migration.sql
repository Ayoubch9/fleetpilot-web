-- MileVoxa Web v4.0.0 — customer-facing brand migration
-- Keeps existing technical table/function identifiers for compatibility.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'plan_name'
  ) then
    update public.companies
    set plan_name = 'MileVoxa Pro'
    where plan_name = 'FleetPilot Pro';
  end if;
end
$$;
