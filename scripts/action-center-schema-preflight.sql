-- READ ONLY: run against the target Supabase before applying the migration.
-- Every row must report present=true. Missing fields disable that source; do
-- not invent columns or alter existing business tables to make this pass.
with required(table_name,column_name) as (values
 ('trucks','id'),('trucks','company_id'),('trucks','unit_number'),('trucks','current_mileage'),
 ('maintenance_records','id'),('maintenance_records','company_id'),('maintenance_records','truck_id'),('maintenance_records','service_type'),('maintenance_records','service_date'),('maintenance_records','next_service_date'),('maintenance_records','next_service_mileage'),
 ('documents','id'),('documents','company_id'),('documents','truck_id'),('documents','name'),('documents','document_type'),('documents','expiration_date'),
 ('expenses','id'),('expenses','company_id'),('expenses','truck_id'),('expenses','category'),('expenses','expense_date'),('expenses','amount'),('expenses','gallons'),('expenses','fuel_price_per_gallon'),
 ('weekly_odometer_records','company_id'),('weekly_odometer_records','truck_id'),('weekly_odometer_records','week_start'),('weekly_odometer_records','start_odometer'),('weekly_odometer_records','end_odometer'),
 ('company_members','company_id'),('company_members','user_id'),('companies','id'),('companies','timezone')
)
select r.table_name,r.column_name,c.data_type,c.is_nullable,(c.column_name is not null) as present
from required r left join information_schema.columns c
on c.table_schema='public' and c.table_name=r.table_name and c.column_name=r.column_name
order by r.table_name,r.column_name;
select n.nspname,p.proname,p.prosecdef,pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='current_company_id';
select tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename in ('trucks','maintenance_records','documents','expenses','weekly_odometer_records','company_members','action_center_interactions')
order by tablename,policyname;
