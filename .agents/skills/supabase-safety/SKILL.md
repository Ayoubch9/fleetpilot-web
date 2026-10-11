---
name: supabase-safety
description: Review or implement MileVoxa Supabase data access, authentication, and schema changes with tenant isolation and Web/Mobile compatibility. Use for backend changes or requested data-access reviews.
---

# supabase-safety

Read root AGENTS.md and relevant shared backend/accounting notes. Trace existing browser/server clients, queries, session boundaries, RLS policies, and company/user filters before editing.

Layout-only tasks preserve queries and auth. For authorized backend work, retain the current Supabase setup and client boundaries. Keep service-role keys and privileged operations server-side; never expose or commit credentials or environment values. Preserve RLS and company/user isolation for reads, writes, storage, and API handlers.

Do not silently alter schemas, policies, accounting formulas, or business rules. Prepare reviewable migrations only within explicit scope; describe Web/Mobile compatibility, existing-data effects, and recovery. Use authorized local/staging fixtures. Production data mutations and migration deployment require explicit authorization.

Verify success paths, unauthenticated rejection, and cross-tenant rejection. Static tests do not prove live RLS correctness. For auth or financial changes, run relevant existing tests:
```sh
npm run test:auth-recovery
npm run test:load-domain
npm run test:dashboard-domain
```
Select further affected tests from the canonical manifest.
Run from the repository root:
```sh
npm run typecheck
npm run lint
npm run build
npm run test:regression
git diff --check
```
Inspect pretest:regression first in a dirty tree: it invokes the existing stale-test cleanup. To avoid cleanup side effects, use node scripts/run-all-regression-tests.cjs, which executes the identical 99-test canonical manifest. Never weaken tests, remove coverage, skip failures, or report unrun checks as passing.

Report query/policy changes, isolation evidence, migration status, and unavailable integration checks.
