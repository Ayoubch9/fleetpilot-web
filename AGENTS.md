<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MileVoxa Web — Codex Instructions

## PROJECT

- Public product name: MileVoxa.
- This repository is MileVoxa Web: `C:\projects\fleetpilot_web`.
- Framework: Next.js.
- Production domains: `milevoxa.com` and `www.milevoxa.com`.
- Shared product HQ / source of truth: `C:\projects\MileVoxa`.
- Mobile repository: `C:\projects\fleetpilot`.
- Mobile and Web are two surfaces of the same MileVoxa product.

## SOURCE OF TRUTH

Before significant feature, architecture, backend, accounting, authentication, or release work, consult the relevant Obsidian notes under `C:\projects\MileVoxa`:

- `HQ\MileVoxa Portfolio HQ.md`
- `maps\MileVoxa Portfolio Map.md`
- `shared\Shared Platform & Backend.md`
- `shared\Shared Product Decisions.md`
- `shared\Unified Roadmap.md`
- `shared\Unified Release Map.md`
- `architecture\Accounting Engine.md`
- `HQ\MileVoxa Mobile App HQ.md` when a change may affect Mobile.

## LOCKED ACCOUNTING

Do not change these formulas without an explicit product decision and regression testing:

```text
Net Variable Expenses = Variable Expenses - Reimbursements
Net Expenses = Net Variable Expenses + Fixed Expenses + Revenue Fee + Mileage Fee
Net Profit = Gross Revenue - Net Expenses
Revenue Fee = Gross Revenue × configured percentage
Mileage Fee = Weekly Miles × per-mile rate
```

## SECURITY

- Never place Supabase service-role credentials or other privileged secrets in client code.
- Preserve RLS and company/user isolation.
- Do not expose secret environment variable values.
- Privileged operations must stay server-side.
- Never commit credentials.

## AUTHENTICATION

- Preserve the currently working website-based password-reset flow.
- Do not replace it with the old unstable mobile custom-scheme recovery flow.
- Password reset currently uses `https://www.milevoxa.com/reset-password`.
- Email confirmation is deferred.
- Welcome-email automation is deferred unless explicitly requested.

## PUBLIC BETA

MileVoxa is currently a free public beta.

- No credit card required during beta.
- Paid plans will be announced later.
- Users should receive advance notice before beta access changes.
- Do not reintroduce old 14-day trial or outdated paid-plan messaging unless explicitly requested.

## DEVELOPMENT RULES

- Inspect existing implementation before editing.
- Preserve working functionality.
- Prefer targeted changes over broad rewrites.
- Do not replace real data with fake/demo data.
- Reuse existing components, patterns, types, and business logic where appropriate.
- Keep Web and Mobile terminology/business rules aligned.
- For shared backend/schema changes, consider impact on both repositories.
- Run appropriate typecheck/build/tests after modifications.
- Do not deploy to production unless explicitly requested.
- Do not alter production data during testing unless explicitly approved.
- Keep backups or use version control before risky changes.

## OBSIDIAN UPDATE RULE

After completing a meaningful feature, bug fix, architecture decision, backend change, or release:

- Update the relevant notes under `C:\projects\MileVoxa`.
- Keep Website, Mobile, and Shared product documentation aligned.
- Record important product decisions rather than relying only on chat history.

## AI RULE

MileVoxa AI may explain, forecast, and recommend, but it must never silently modify financial records.

## RELEASE RULE

Stable/release-approved builds should not be casually changed. New functionality belongs in a clearly defined next release.

<!-- MILEVOXA_TASK_SYSTEM_V1 -->

## MILEVOXA TASK SYSTEM

All meaningful development work should use the MileVoxa task system in:
C:\projects\MileVoxa\tasks

Before starting a meaningful feature, bug fix, architecture change, backend/schema change, authentication/security change, accounting change, or release task:

1. Find or create a task ID in C:\projects\MileVoxa\tasks\Task Registry.md.
2. Read the task note under C:\projects\MileVoxa\tasks\items.
3. Confirm the task surface: web, mobile, or shared.
4. Confirm scope, dependencies, acceptance criteria, and testing requirements.
5. Move the task to in-progress only when implementation actually starts.
6. Move it to review when implementation is complete and validation is pending.
7. Move it to done only after required testing passes.
8. Move it to released only after actual deployment/publishing.
9. Update the task's Codex Work Log and relevant Obsidian notes.
10. Never create a duplicate task when an existing task already covers the work.

For Web + Mobile work:
- plan in the MileVoxa HQ first,
- implement Web and Mobile in their respective repositories,
- then update the shared task and HQ documentation.

Do not store credentials or secrets in task notes.

## CODEX SCOPE AND BASELINE

MileVoxa is a trucking business operating system for owner-operators and small fleets.

- Preserve the existing App Router architecture, component boundaries, Next.js/Supabase setup, dependencies, and package version 4.7.1. Do not change versions or infrastructure as part of unrelated work.
- Layout-only tasks must not change Supabase queries, auth, GA4, formulas, routes, imports/exports, or business rules unless explicitly requested. Choose an approach within scope; explain any specific conflict before proceeding.
- Preserve real data, event handlers, navigation, loading/error/empty states, and accessible interactions.
- Approved design tokens: #102238, #0B1730, #10B981, #059669, #34D399. Reuse established styles rather than creating a competing theme.
- Typography: Plus Jakarta Sans for the interface and JetBrains Mono for numeric/technical content according to existing usage. Preserve current font loading.
- Never weaken, skip, delete, or reduce tests to obtain a pass. Preserve the 99-test canonical manifest and runner; add meaningful coverage when behavior changes.
- Preserve unrelated working-tree changes. Stage only task-related files or hunks and review the staged diff before committing.

## VALIDATION AND LOCAL SKILLS

Run commands from the repository root. Application changes require npm run typecheck, npm run lint, npm run build, and npm run test:regression. The 4.7.1 baseline has 99 tests in scripts/regression-test-manifest.json.
The regression command's pretest hook runs scripts/cleanup-stale-tests-v4_7_1.cjs. Inspect it first in a dirty tree. Use node scripts/run-all-regression-tests.cjs to run the same canonical suite without cleanup side effects. Do not modify the hook or manifest to bypass failures.
For documentation-only changes, validate skill structure and git diff --check; application checks are optional. Report failures and unrun checks accurately.

Repo-local skills under .agents/skills/:

- milevoxa-page-redesign: visual changes within the approved design system and layout-only boundary.
- regression-guardian: canonical regression verification, failure diagnosis, and coverage preservation.
- supabase-safety: data access, tenant isolation, authentication, and schema review.
- bug-repair: reproduce defects, repair their cause, and verify behavior.
- release-readiness: assess release evidence without implying deployment authorization.

Use the relevant skill for the task. Skills do not expand user authorization or override repository rules.
