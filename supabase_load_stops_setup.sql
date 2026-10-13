-- Add an ordered stop list to each existing load without changing financial
-- rows, formulas, authorization, or the legacy pickup/delivery endpoints.
-- Safe to re-run. Review and apply manually in the intended Supabase project.

alter table public.loads
  add column if not exists route_stops jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'loads_route_stops_shape_check'
      and conrelid = 'public.loads'::regclass
  ) then
    alter table public.loads
      add constraint loads_route_stops_shape_check
      check (
        case
          when jsonb_typeof(route_stops) = 'array' then
            jsonb_array_length(route_stops) = 0
            or (
              jsonb_array_length(route_stops) between 2 and 20
              and route_stops->0->>'kind' = 'PICKUP'
              and route_stops->(jsonb_array_length(route_stops) - 1)->>'kind' = 'DELIVERY'
            )
          else false
        end
      );
  end if;
end;
$$;

comment on column public.loads.route_stops is
  'Ordered route details for this load; legacy pickup/delivery fields remain the route endpoints.';

create or replace function public.sync_load_route_stop_endpoints()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_stop_count integer;
  v_last_index text;
begin
  if coalesce(jsonb_typeof(new.route_stops), '') <> 'array' then
    raise exception 'route_stops must be a JSON array';
  end if;

  if jsonb_array_length(new.route_stops) = 0 then
    new.route_stops := jsonb_build_array(
      jsonb_build_object(
        'id', 'legacy-pickup',
        'kind', 'PICKUP',
        'facility', '',
        'location', coalesce(new.pickup, ''),
        'appointmentDate', coalesce(new.pickup_date::text, ''),
        'appointmentTime', '',
        'timeCertainty', 'TBD',
        'instructions', ''
      ),
      jsonb_build_object(
        'id', 'legacy-delivery',
        'kind', 'DELIVERY',
        'facility', '',
        'location', coalesce(new.delivery, ''),
        'appointmentDate', coalesce(new.delivery_date::text, ''),
        'appointmentTime', '',
        'timeCertainty', 'TBD',
        'instructions', ''
      )
    );
  elsif tg_op = 'UPDATE'
    and new.route_stops is not distinct from old.route_stops
    and (
      new.pickup is distinct from old.pickup
      or new.delivery is distinct from old.delivery
      or new.pickup_date is distinct from old.pickup_date
      or new.delivery_date is distinct from old.delivery_date
    ) then
    -- Older clients only know the legacy endpoint columns. If they changed
    -- those while leaving route_stops untouched, mirror their endpoint edits.
    v_stop_count := jsonb_array_length(new.route_stops);
    v_last_index := (v_stop_count - 1)::text;
    new.route_stops := jsonb_set(
      new.route_stops,
      '{0,location}',
      to_jsonb(coalesce(new.pickup, '')),
      true
    );
    new.route_stops := jsonb_set(
      new.route_stops,
      '{0,appointmentDate}',
      to_jsonb(coalesce(new.pickup_date::text, '')),
      true
    );
    new.route_stops := jsonb_set(
      new.route_stops,
      array[v_last_index, 'location'],
      to_jsonb(coalesce(new.delivery, '')),
      true
    );
    new.route_stops := jsonb_set(
      new.route_stops,
      array[v_last_index, 'appointmentDate'],
      to_jsonb(coalesce(new.delivery_date::text, '')),
      true
    );
  elsif tg_op = 'INSERT'
    or new.route_stops is distinct from old.route_stops then
    -- New clients submit full stop locations. Preserve them and mirror only
    -- the dates into the legacy date columns.
    v_stop_count := jsonb_array_length(new.route_stops);
    v_last_index := (v_stop_count - 1)::text;
    new.pickup_date := coalesce(
      nullif(new.route_stops->0->>'appointmentDate', '')::date,
      new.pickup_date
    );
    new.delivery_date := coalesce(
      nullif(new.route_stops->v_last_index->>'appointmentDate', '')::date,
      new.delivery_date
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sync_load_route_stop_endpoints on public.loads;
create trigger sync_load_route_stop_endpoints
before insert or update on public.loads
for each row
execute function public.sync_load_route_stop_endpoints();
