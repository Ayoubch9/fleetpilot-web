# MileVoxa Web v4.3.29 — Weekly Odometer

Built on v4.3.28.

## Website weekly odometer entry
MileVoxa already used `weekly_odometer_records` when calculating Weekly
Settlement, including the company mileage fee (default $0.15/mile), but the web
app had no UI for entering those records.

This release adds:
- `/odometer`
- `Weekly Odometer` under Analytics in the desktop sidebar
- `Weekly Odometer` in the responsive web More menu
- per-truck starting and ending odometer entry for the selected week
- live weekly-mile calculation
- live mileage-expense calculation
- save/update against the existing `weekly_odometer_records` table

No new Supabase table or migration is required. The feature uses the existing
table already read by settlement, reports, export, and Pilot AI.
