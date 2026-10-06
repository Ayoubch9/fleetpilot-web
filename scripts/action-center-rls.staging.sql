-- STAGING ONLY: apply supabase_action_center_v1.sql first. Run as postgres.
-- Requires two members in company A and one member in another company B.
-- Uses existing fixture memberships; inserts only a test interaction and rolls
-- everything back. Never creates or changes a truck/expense/document/payment.
begin;
do $$
declare a uuid; b uuid; peer uuid; tenant_a uuid;
begin
  select company_id into tenant_a from public.company_members
  group by company_id having count(distinct user_id) >= 2 limit 1;
  select user_id into a from public.company_members where company_id = tenant_a order by user_id limit 1;
  select user_id into peer from public.company_members where company_id = tenant_a and user_id <> a order by user_id limit 1;
  select user_id into b from public.company_members where company_id <> tenant_a and user_id not in (a,peer) limit 1;
  if a is null or b is null or peer is null then raise exception 'Missing staging fixture memberships'; end if;
  perform set_config('test.ac_user_a',a::text,true);
  perform set_config('test.ac_user_b',b::text,true);
  perform set_config('test.ac_peer',peer::text,true);
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.ac_user_a'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.ac_user_a'),'role','authenticated')::text,true);
set local role authenticated;
select set_config('test.ac_tenant_a',public.current_company_id()::text,true);
insert into public.action_center_interactions(alert_key,source,fingerprint,action)
values ('maintenance:action-center-rls-probe','maintenance','critical:test','acknowledge');
do $$ begin
  if (select count(*) from public.action_center_interactions where alert_key='maintenance:action-center-rls-probe') <> 1 then raise exception 'Own interaction not visible'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.ac_peer'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.ac_peer'),'role','authenticated')::text,true);
do $$ begin
  if public.current_company_id() <> current_setting('test.ac_tenant_a')::uuid then raise exception 'Peer fixture must resolve to company A'; end if;
  if (select count(*) from public.action_center_interactions where alert_key='maintenance:action-center-rls-probe') <> 0 then raise exception 'Same-company peer leaked another user interaction'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.ac_user_b'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.ac_user_b'),'role','authenticated')::text,true);
do $$
declare affected integer;
begin
  if public.current_company_id() = current_setting('test.ac_tenant_a')::uuid then raise exception 'Fixtures must resolve to distinct current companies'; end if;
  if (select count(*) from public.action_center_interactions where alert_key='maintenance:action-center-rls-probe') <> 0 then raise exception 'Cross-company SELECT leaked'; end if;
  update public.action_center_interactions set action='dismiss' where alert_key='maintenance:action-center-rls-probe';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-company UPDATE allowed'; end if;
  delete from public.action_center_interactions where alert_key='maintenance:action-center-rls-probe';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-company DELETE allowed'; end if;
  begin
    insert into public.action_center_interactions(company_id,user_id,alert_key,source,fingerprint,action)
    values (current_setting('test.ac_tenant_a')::uuid,current_setting('test.ac_user_b')::uuid,'documents:forged-tenant','documents','warning:test','acknowledge');
    raise exception 'Cross-company INSERT allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.action_center_interactions(user_id,alert_key,source,fingerprint,action)
    values (current_setting('test.ac_user_a')::uuid,'documents:forged-user','documents','warning:test','acknowledge');
    raise exception 'Other-user INSERT allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
-- Successful completion confirms the RLS checks; errors abort the transaction.
