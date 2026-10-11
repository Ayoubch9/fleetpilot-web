---
name: release-readiness
description: Assess MileVoxa release readiness with canonical tests, builds, security evidence, and scoped review. Use for pre-release preparation; deployment requires explicit authorization.
---

# release-readiness

Read root AGENTS.md, DEPLOYMENT_CHECKLIST.md, and relevant shared release notes. Identify the exact revision and working-tree state being assessed. Preserve version 4.7.1 unless explicitly asked to change it; do not upgrade dependencies or hide failures.

Review scope, Supabase/auth changes, GA4, routes, accounting, and Web/Mobile compatibility. Check approved design tokens and typography for changed UI. Review migrations, environment variable names (never values), and recovery requirements when relevant. A dirty-tree build is not evidence for a different committed revision.
Run from the repository root:
```sh
npm run typecheck
npm run lint
npm run build
npm run test:regression
git diff --check
```
Inspect pretest:regression first in a dirty tree: it invokes the existing stale-test cleanup. To avoid cleanup side effects, use node scripts/run-all-regression-tests.cjs, which executes the identical 99-test canonical manifest. Never weaken tests, remove coverage, skip failures, or report unrun checks as passing.

Also run:
```sh
npm run audit:prod
git diff --cached --check
git diff --cached --stat
```
Report vulnerabilities without automatic dependency fixes outside scope.

Exercise affected core flows with authorized local/staging data: sign-in/recovery, navigation, loads, expenses, settlement, documents, and other changed features. Check responsive UI and error/empty states where relevant; report exactly which flows were exercised.

Give a readiness verdict with revision, results, unresolved failures, migration requirements, and recovery plan when needed. Commit only authorized preparation changes. Exclude secrets, generated artifacts, backups, and unrelated work. Release review does not authorize pushing, production deployment, migrations, or production data mutations.
