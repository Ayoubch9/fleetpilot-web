# FleetPilot Web v2.6.0 — Company Profile + Preferences

## Company
Settings → Company now contains a real trucking business profile:

Business Identity:
- Display Name
- Legal Business Name
- USDOT Number
- MC Number

Contact:
- Business Email
- Business Phone

Business Address:
- Address
- Address Line 2
- City
- State
- ZIP Code
- Country

Operations:
- Company Time Zone
- Current member role

Only the company owner can edit company-level information.

## Preferences
The Preferences tab was reorganized so it no longer presents USD/Miles as
fake selectable dropdowns.

Regional & Formatting:
- Language
- Date Format
- Time Format
- Time Zone

Operating Defaults:
- Week Starts On
- Default Performance Period
- Currency shown as a locked USD capability
- Distance shown as a locked Miles capability

Display:
- Compact Tables preference

Existing notification preferences remain under Notifications.

## Database migration
Run once:

`supabase_company_preferences_setup.sql`

It adds the company profile fields and the new user preference columns.
Existing authenticated RLS policies remain in place.

No anonymous access or service-role credentials are introduced.
