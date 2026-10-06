# Action Center V1 implementation report

Local implementation is complete and builds successfully. It is not deployed. The migration is prepared but has not been applied. No business records or production alerts were inserted or changed.

## Schema inspection and its limits

Inspected the actual Dashboard, Maintenance, Documents, Reimbursements, Expenses, Fuel Analytics, Weekly Settlement and Weekly Odometer implementations, shared financial calculations, existing alert/notification code, authentication/account handling, and repository Supabase setup scripts. Source columns come from these implementations; company isolation follows the repository's `current_company_id()` and `company_members` patterns.

The initial workspace had no `.env.local` or authenticated database connection. Follow-up discovery located the actual application at `C:\projects\fleetpilot_web` and an authenticated Supabase CLI linked through the Flutter project at `C:\projects\fleetpilot`. A SELECT-only audit of Fleetpilot project `dntnmzeoybianhzwufpz` now verifies the live source columns, data types, tenant selector definition, enabled RLS and existing company-scoped policy definitions. See `ACTION_CENTER_SCHEMA_AUDIT.json`. **Effective database tenant-isolation tests and the new migration remain unexecuted.** `scripts/action-center-schema-preflight.sql` should still be run against any separate staging target before applying its migration.

## Exact file changes

Paths below are relative to this repository (`milevoxa-web`).

Modified:

- `package.json`: adds `test:action-center`; no dependencies changed.
- `src/app/dashboard/page.tsx`: loads Action Center alongside existing dashboard queries and renders the summary immediately after the financial KPI strip.
- `src/components/app-shell.tsx`: adds the desktop Action Center navigation entry and hides its irrelevant week selector.
- `src/components/mobile-app-navigation.tsx`: adds Action Center to the mobile More menu and supported page names.

Added:

- `src/lib/action-center-domain.ts`: alert DTOs, source types, date/number validation, pure derivation and interaction partitioning. Reuses existing expense taxonomy for source routes.
- `src/lib/action-center.ts`: authenticated company context, explicitly company-scoped paginated source queries, source failure isolation, interaction loading and resolution reconciliation.
- `src/components/action-center.tsx`: shared responsive dashboard/full-page UI, severity/truck filters, view links, interaction controls and empty/error states.
- `src/app/action-center/page.tsx`: authenticated View All page.
- `src/app/api/action-center/route.ts`: versioned authenticated JSON GET and validated same-origin POST interactions.
- `supabase_action_center_v1.sql`: transactional interaction-state migration.
- `scripts/action-center.test.cjs`: domain, source loading, API, tenant query scoping and component rendering tests. All test fixtures are isolated from Supabase.
- `scripts/action-center-schema-preflight.sql`: read-only deployed-schema verification.
- `scripts/action-center-rls.staging.sql`: staging-only RLS assertions in a rolled-back transaction.
- `ACTION_CENTER_V1_REPORT.md`: this report.
- `ACTION_CENTER_SCHEMA_AUDIT.json`: live schema and RLS definition metadata obtained by a SELECT-only audit; contains no business records or credentials.
- `scripts/action-center-staging.cjs`: production-rejecting runner for isolated fixtures, real signed-in tenant/user isolation checks and source resolution.
- `ACTION_CENTER_STAGING_PLAN.md`: concrete temporary-branch verification and cleanup plan; resource creation awaits a spending-limit answer.

Generated local build output is ignored. The tracked TypeScript incremental-build file was restored to its original contents. Existing source pages, financial algorithms, authentication, existing RLS, existing notification preferences and unrelated features were not changed.

## Derived rules and UI behavior

- Maintenance: latest dated service record per truck/service describes the next schedule. One alert per record combines date and mileage; critical when a threshold is passed, warning within 14 days or 1,000 miles. Missing mileage is never treated as zero. Conflicting latest service dates produce an incomplete-check warning instead of a guessed schedule or false resolution.
- Documents: warning through 30 days before expiry; critical after expiry. Uses the existing document `focus` route.
- Expenses: compare recent individual purchases to earlier purchases in the same truck and exact source category. Requires at least 12 valid earlier purchases spanning two calendar months, within 90 days. Alerts only within the recent seven-day review window. An amount must exceed 3 times the median and exceed the greater of $250 or 6 median absolute deviations above the median. This is a conservative purchase anomaly, not a fleet spending or profitability assertion.
- Fuel: same history guard, using actual amount/gallons and checking consistency with recorded price when available. Requires price above 1.5 times the median and more than the greater of $1/gallon or 6 median absolute deviations above it. No guessed MPG.
- Settlement: only existing weekly odometer rows with a valid starting reading and missing or lower ending reading, after the week plus Monday grace, within 90 days. Links to the existing week-specific odometer editor. Does not alter settlement calculations or infer missing rows as mandatory work.
- Date-only comparisons use the verified existing `companies.timezone` setting. Invalid/unavailable timezone configuration produces an explicit incomplete-check notice and UTC fallback. Snoozes use UTC timestamps; Tomorrow means 24 hours from the interaction. No company settings are changed.
- Dashboard shows up to five highest-priority active items; critical, warning, attention, then date and stable key ordering. It shows all available alerts when fewer than three exist.
- View All has severity/truck filters, Snoozed, Dismissed/Acknowledged and Recently Resolved sections. View/Fix links use existing routes and supported query fields.
- Critical snoozes are limited to tomorrow. Warning/attention snoozes support tomorrow, seven and 30 days. Critical and warning acknowledgment leaves the item visible. Only attention anomalies can be dismissed from the active list, with Restore available.
- SHA-256 fingerprints include condition inputs and severity without storing business values. Condition changes/escalation invalidate old snoozes and dismissals; previously resolved recurrences start fresh. Forged long critical snoozes in storage cannot permanently suppress a current critical item.
- Recently Resolved covers previously interacted items only. It means the condition no longer generates an alert, including replacement schedules, source deletions and anomalies leaving the review window. It is not an audit trail of every untracked business condition. Failed, truncated or ambiguous checks never mark those sources resolved.
- Missing interaction storage leaves derived alerts visible and disables interaction controls. Failed sources display an incomplete-check message; an unavailable check never produces the confident all-caught-up state.

## Proposed schema change

Exactly one new table: `public.action_center_interactions`.

Columns: `company_id`, `user_id`, `alert_key`, `source`, `truck_id`, `fingerprint`, `action`, `snoozed_until`, `updated_at`, `resolved_at`.

Primary key: `(company_id, user_id, alert_key)`. Company and user foreign keys cascade on account removal. One recent-interactions index supports company/user reads. Constraints bound keys/fingerprints, sources, actions and snooze duration. `truck_id` is only an optional interaction context reference, avoiding an unrelated business-record mutation or a cross-company foreign-key lookup.

RLS requires both `user_id = auth.uid()` and `company_id = current_company_id()`, plus actual membership in that company, for SELECT/INSERT/UPDATE/DELETE. Both USING and WITH CHECK enforce that boundary. Anonymous privileges are revoked. No existing table, business column, source record or policy is changed.

Generated alert titles, descriptions, amounts and source snapshots are never persisted. Resolution timestamps are reconciled only for already-interacted items, with at most two scoped writes per read. Fingerprints are hashes of the condition rather than duplicate business values.

## Performance and mobile contract

After loading the company's verified timezone, five source adapters run in parallel. Each source is read once per Action Center load, in stable pages of 500 with an exact first-page count. Expense/odometer history is bounded to 120 days; no per-alert source queries or polling. Sources above 10,000 rows or unexpected database row caps degrade as unavailable rather than silently truncating data. Interaction history is bounded to the 1,000 most recently updated rows; older state outside that bound does not hide an alert.

React memoization is request scoped, never a shared tenant cache. Existing AppShell notification queries remain unchanged to preserve their behavior; this feature does not replace that notification engine. Interaction submissions rederive once before writing to reject stale or foreign alert IDs.

GET `/api/action-center` returns version 1, generation timestamp, active/snoozed/acknowledged derived DTOs, recent resolutions, interactions, truck filter options, availability and source errors. DTOs contain stable `id`, source/sourceId, severity, title, explanation, truckId, context, href/actionLabel, fingerprint and sortDate. POST accepts `{id, action, days?}`; company and user come only from verified server context. Responses are private/no-store.

The derivation service and JSON contract are reusable for Flutter. Current transport uses the existing web cookie session and same-origin write protection; a Flutter bearer-auth adapter is a later integration, not claimed implemented here. No push notifications were added.

## Verification results

- `npm run test:action-center`: PASS. Zero/multiple alerts, boundaries, latest-service supersession, ambiguity, missing/invalid dates and mileage, conservative expense/fuel history, truck comparison isolation, odometer completion rules, critical acknowledgment/dismissal protection, snooze expiry/escalation/recurrence, dashboard five-item cap, source failures, unavailable interaction storage, pagination beyond 500, unexpected server row caps, resolution safety, company/user query scoping, no-store API responses, invalid/stale/foreign IDs, cross-origin POST rejection and unauthenticated GET rejection.
- `npm run typecheck`: PASS.
- Focused ESLint on all new Action Center TypeScript/TSX and its test: PASS.
- `npm run lint`: FAIL, 261 errors and 77 warnings in existing repository code. The touched Dashboard/AppShell lint findings are existing: the Dashboard has one prefer-const error and three unused-variable warnings, AppShell has three warnings. Running ESLint on the original committed Dashboard source confirms the same Dashboard findings. No unrelated lint cleanup was performed.
- `npm run build`: PASS on the final implementation; includes `/action-center` and `/api/action-center` and all existing feature routes. The first sandboxed attempt hit Windows path-access restrictions; the authorized local build outside that sandbox passed.
- Regression checks: dashboard-domain, settlement-history, weekly-odometer, settlement-split-fixed-company-fees, settlement-cost-ledger-company-fees and documents-command-center: all PASS.
- Browser visual verification: real component rendered into isolated HTML fixtures with production CSS. Multi-alert desktop at 1280 pixels and mobile at 375 pixels reviewed; no horizontal overflow. Zero-alert and source-error fixtures reviewed. Narrow 320-pixel source-error layout also has no horizontal overflow. Updated action controls measure 44 pixels high. These are rendering/layout checks, not authenticated end-to-end interaction tests.
- `git diff --check`: PASS.
- Live Supabase schema/policy-definition audit: PASS through the existing authenticated CLI; all required Action Center source fields are present. RLS is enabled on all seven inspected tenant/membership tables. The current tenant function is a stable security-definer function with fixed public search_path and chooses the user's earliest company membership. The new interaction table does not yet exist.
- Migration execution, effective database RLS tests and authenticated full-flow browser tests: NOT RUN; no isolated staging environment or staging test-account access is available. Mock query-scoping assertions and policy-definition inspection do not constitute database-level tenant-isolation proof.

## Unsupported or deliberately restricted alert types

- Outstanding reimbursements: the current implementation records recovered payments (`reimbursement_date`, `amount`, optional `expense_id` and direct truck/category/reference). It has no verified pending request, submitted-at or workflow-status source. A partial payment or an unreimbursed expense alone does not establish an outstanding request.
- General settlement completeness, missing load paperwork, expected-but-absent expenses, unpaid settlement workflow and missing odometer rows: no verified required-record/workflow model establishes these conditions. Only objectively incomplete existing odometer rows are supported.
- Fleet spending spikes, MPG deterioration or fuel efficiency comparisons: load miles, gallons and purchases do not establish complete comparable mileage/refill periods. Only conservative same-truck purchase amount/price anomalies are supported.
- Ambiguous same-date maintenance histories and sources over the safety cap are explicitly reported as incomplete checks. A dedicated schedule/completion model may be needed to support those cases reliably.
- The verified live odometer schema requires `end_odometer` (NOT NULL); a missing end cannot be stored as SQL NULL. The current applicable signal is an end reading below its starting reading. The domain guards missing values for incomplete adapter input, but that branch is not claimed as a representable live workflow.

## Before production

1. Connect the intended Supabase environment and run the read-only schema preflight. Verify tenant selector behavior, membership policies, all selected source fields and source date/number types against the live database.
2. Review the migration, apply it in staging, and run `scripts/action-center-rls.staging.sql` with staging fixture members: two users in company A and one in company B. The script only inserts an interaction inside a transaction and rolls it back.
3. With real staging test accounts, verify authentication/entitlement, dashboard and View All, filters, View/Fix source navigation, snooze/acknowledge/restore, source edits resolving conditions, recurrence, migration-missing behavior and multi-company isolation end to end.
4. Obtain approval for applying `supabase_action_center_v1.sql` to production and for deploying this code. Neither action has been performed. Existing alerts remain readable if code is deployed before storage, but interaction persistence needs the migration.

Isolated staging and staging test accounts block the remaining database and authenticated-flow verification. Production approval should follow review of the staged result and migration.

## Follow-up: connected staging discovery

Read-only inspection through the connected Vercel app located `fleetpilot-web` in the user's account. Its current deployment is marked Production. No custom staging environment is listed. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` each have one environment-variable entry targeting both Production and Preview, with no branch override listed. Thus the current preview configuration uses the same Supabase settings as production; a Vercel preview is not evidence of an isolated staging database.

No credential values were printed. No hosting configuration, deployment, business record or application schema migration was changed during discovery. The missing prerequisite is a confirmed separate staging Supabase project and staging test-account access. The migration and database RLS tests remain unexecuted.

## Follow-up: actual computer project

The user identified the local Fleetpilot web project. Located it at `C:\projects\fleetpilot_web`, verified a clean checkout and exact matches to the workspace baseline for the four existing files affected by this feature, then transferred and hash-verified the Action Center implementation. The local `.env.local`, credentials and existing business source pages were preserved. Changes remain uncommitted and unpushed.

The actual local project passes Action Center tests, typecheck, focused lint, Dashboard/Settlement regressions and its production build. Browser checks against the locally built app confirm signed-out `/action-center` and `/dashboard` navigate to `/login`, with no captured browser errors. Signed-out `/api/action-center` returns HTTP 401. The temporary verification server was stopped.

Anonymous OpenAPI schema requests using local public settings returned HTTP 401. The installed authenticated Supabase CLI subsequently provided a successful SELECT-only metadata audit, resolving the earlier schema-access limitation without reading business rows. CLI project/branch discovery lists one Fleetpilot project and no Fleetpilot database branches; no isolated staging target is confirmed. The live audit also discovered `companies.timezone`, which is now used by the alert engine and covered by company-midnight/fallback tests. No pending reimbursement request/status/submission columns exist in the inspected live reimbursement table.

## Follow-up: staging preparation

Docker and psql are not installed on this computer. Prepared `action-center-v1-qa` as a schema-only ephemeral Supabase branch and an isolated runner using the verified live constraint values (including company membership roles). Supabase cloud branching adds hourly charges; a $1 limit and branch deletion after testing have been presented for approval. No branch, fixture, database migration or deployment has been created/applied during this preparation. Runner syntax, focused lint and three fail-closed target checks pass; live staging execution remains pending.
