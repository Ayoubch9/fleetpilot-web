# Temporary isolated staging verification

Prepared target: a schema-only, ephemeral Supabase branch named `action-center-v1-qa` under Fleetpilot project `dntnmzeoybianhzwufpz`. No production data is to be cloned. The branch has its own database, Auth, Storage and API credentials. Do not merge it back to production.

Creating the branch is awaiting a spending-limit answer. Supabase's documented Micro branch compute starts at $0.01344/hour, plus usage, and is outside the Spend Cap. Proposed limit: $1 for this verification, with branch deletion after the tests to stop further charges. No billable resource has been created.

Source: https://supabase.com/docs/guides/platform/manage-your-usage/branching

## Execution after approval

1. Create the named ephemeral branch without `--with-data` or `--persistent`. Record its actual branch ID and project reference; reject the live Fleetpilot reference for every mutation.
2. Verify its source schema with `scripts/action-center-schema-preflight.sql`. Confirm it is a separate target and contains no pre-existing business records.
3. Apply `supabase_action_center_v1.sql` to that branch only. Repeat it once to verify safe idempotent execution.
4. Obtain only this branch's public and service credentials without printing them. Keep temporary fixture IDs and synthetic passwords outside Git, under the isolated test working directory.
5. Run `scripts/action-center-staging.cjs seed`. This creates two isolated companies, three synthetic users, two trucks, and five detectable maintenance/document/expense/fuel/odometer conditions. It refuses the production project, mismatched URLs, unconfirmed staging or pre-existing business data. It sends no invitation or confirmation emails.
6. Run `scripts/action-center-rls.staging.sql` and `scripts/action-center-staging.cjs check`. Verify own-state access, company source isolation, same-company per-user state isolation, cross-company SELECT/INSERT/UPDATE/DELETE rejection, and forged user IDs. The SQL probe is rolled back.
7. Build a separate local app copy with the staging credentials. Preserve `C:\projects\fleetpilot_web\.env.local` and its existing production connection. Never repoint the current Vercel Preview configuration, which shares Production's database settings.
8. In the real browser, sign in as staging owner and verify five dashboard alerts, View All filters, source links, tomorrow/seven/30-day snooze options, critical long-snooze rejection, acknowledgment visibility, anomaly dismissal/restore, and persistence after refresh. Sign in as peer/other-company to verify isolation through the app.
9. Run the staging-only resolve mode, refresh, and verify zero-alert/all-caught-up behavior and recent resolution of interacted conditions. Verify source failure behavior without changing production.
10. Stop the staging app, remove the temporary branch, verify deletion, and report results. Keep only non-secret verification artifacts. Production migration and deployment remain separate approval steps.

## Prepared runner

`scripts/action-center-staging.cjs` supports `seed`, `check`, and `resolve`.

Required temporary environment variables: `ACTION_CENTER_STAGING_REF`, `ACTION_CENTER_STAGING_URL`, `ACTION_CENTER_STAGING_CONFIRMED=1`, `ACTION_CENTER_STAGING_ANON_KEY`, `ACTION_CENTER_STAGING_SERVICE_KEY`, `ACTION_CENTER_STAGING_STATE_FILE`.

The script passes JavaScript syntax and focused lint checks. Production-target, mismatched-host and unconfirmed-staging rejection checks pass before any network access. Actual migration, sign-in and RLS results are not claimed until the branch is created and tested.
