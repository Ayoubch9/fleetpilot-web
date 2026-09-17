# FleetPilot Web v3.7.5 — Google Onboarding owner_user_id Fix

Fixes first-time Google signup against the existing FleetPilot companies schema.

Observed Supabase error:

`null value in column "owner_user_id" of relation "companies" violates not-null constraint`

The onboarding RPC now creates a company with:
- `name`
- `owner_user_id = auth.uid()`

Then it creates the matching `company_members` owner row.

Run the updated `supabase_social_auth_onboarding_setup.sql` once in Supabase SQL Editor.
The function is dropped and recreated safely.
