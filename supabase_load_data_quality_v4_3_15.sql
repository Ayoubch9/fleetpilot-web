-- MileVoxa v4.3.15
-- Load data cleanup + database-side validation/normalization.
--
-- IMPORTANT:
-- Load #012578 has an unverified real-world mileage. We do NOT invent a value.
-- If it is still stored as 0 total miles, convert the mileage fields to NULL
-- so the app renders "-" until a verified mileage is entered.

begin;

-- 1) Targeted data cleanup: remove the false 0-mile value without inventing mileage.
update public.loads
set
  loaded_miles = null,
  deadhead_miles = null
where load_number = '012578'
  and lower(trim(coalesce(pickup, ''))) = 'san antonio, tx'
  and lower(trim(coalesce(delivery, ''))) = 'north salt lake, ut'
  and coalesce(loaded_miles, 0) + coalesce(deadhead_miles, 0) = 0;

-- 2) Targeted location typo cleanup.
update public.loads
set pickup = 'Katy, TX'
where lower(regexp_replace(trim(coalesce(pickup, '')), '\s+', '', 'g')) = 'katy,fo,tx';

update public.loads
set delivery = 'Katy, TX'
where lower(regexp_replace(trim(coalesce(delivery, '')), '\s+', '', 'g')) = 'katy,fo,tx';

-- 3) Shared state-code whitelist.
create or replace function public.milevoxa_valid_us_state_code(value text)
returns boolean
language sql
immutable
as $$
  select upper(trim(value)) = any (array[
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC'
  ]);
$$;

-- 4) Normalize "City, ST" location casing and reject invalid state codes.
create or replace function public.milevoxa_normalize_us_location(value text)
returns text
language plpgsql
immutable
as $$
declare
  cleaned text;
  city_part text;
  state_part text;
  parts text[];
begin
  cleaned := regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g');

  parts := regexp_match(cleaned, '^(.+),\s*([A-Za-z]{2})$');

  if parts is null then
    raise exception 'Location must use "City, ST" format.';
  end if;

  city_part := initcap(lower(trim(parts[1])));
  state_part := upper(trim(parts[2]));

  if city_part = '' then
    raise exception 'Location city is required.';
  end if;

  if not public.milevoxa_valid_us_state_code(state_part) then
    raise exception 'Invalid U.S. state code: %', state_part;
  end if;

  return city_part || ', ' || state_part;
end;
$$;

-- 5) Harden loads at the database boundary.
--    - INSERT: requires at least 1 total mile.
--    - UPDATE: rejects explicit 0-mile values.
--    - NULL/NULL is allowed only as an unknown legacy/data-cleanup state so
--      load #012578 can remain "-" until a verified mileage is entered.
create or replace function public.milevoxa_validate_load_row()
returns trigger
language plpgsql
as $$
declare
  total_miles numeric;
begin
  new.pickup := public.milevoxa_normalize_us_location(new.pickup);
  new.delivery := public.milevoxa_normalize_us_location(new.delivery);

  total_miles := coalesce(new.loaded_miles, 0) + coalesce(new.deadhead_miles, 0);

  if tg_op = 'INSERT' and total_miles <= 0 then
    raise exception 'A load must have at least 1 total mile.';
  end if;

  if tg_op = 'UPDATE'
     and not (new.loaded_miles is null and new.deadhead_miles is null)
     and total_miles <= 0 then
    raise exception 'A load must have at least 1 total mile.';
  end if;

  if new.loaded_miles is not null and new.loaded_miles < 0 then
    raise exception 'Loaded miles cannot be negative.';
  end if;

  if new.deadhead_miles is not null and new.deadhead_miles < 0 then
    raise exception 'Deadhead miles cannot be negative.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_milevoxa_validate_load_row on public.loads;

create trigger trg_milevoxa_validate_load_row
before insert or update of pickup, delivery, loaded_miles, deadhead_miles
on public.loads
for each row
execute function public.milevoxa_validate_load_row();

commit;
