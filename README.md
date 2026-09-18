# FleetPilot Web v3.8.1 — Settings Legal & Privacy Center

Adds a dedicated logged-in Settings tab:

**Settings -> Legal & Privacy**

Includes:
- Privacy Policy
- Terms of Service
- Data Deletion
- Export My Data
- Google Sign-In account information
- Delete FleetPilot Account

The existing Security tab remains available for password/sign-out/security actions.

The legal pages remain public:
- `/privacy`
- `/terms`
- `/data-deletion`

No new Supabase migration is required beyond the v3.8.0
`supabase_account_deletion_setup.sql`.
