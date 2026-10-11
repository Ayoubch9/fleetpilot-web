---
name: bug-repair
description: Reproduce and repair concrete MileVoxa defects with focused changes and meaningful regression verification. Use for broken behavior, runtime errors, or reproducible regressions.
---

# bug-repair

Read root AGENTS.md. Establish the trigger, expected behavior, actual result, and affected surface. Inspect code and tests, reproduce the failure where possible, and distinguish a verified cause from a hypothesis.

Make the smallest durable repair in the existing architecture. Preserve the Next.js/Supabase setup, version 4.7.1, and unrelated behavior. For layout-only work, do not change Supabase queries, auth, GA4, formulas, routes, imports/exports, or business rules unless explicitly requested.

For a behavior defect, add or strengthen a meaningful regression that fails for the original cause and passes after repair. Reuse existing test style and register new canonical tests in the manifest when appropriate. Never weaken existing assertions or expand into unrelated refactoring.

Run the affected test directly using its filename from scripts/regression-test-manifest.json, then run full validation.
Run from the repository root:
```sh
npm run typecheck
npm run lint
npm run build
npm run test:regression
git diff --check
```
Inspect pretest:regression first in a dirty tree: it invokes the existing stale-test cleanup. To avoid cleanup side effects, use node scripts/run-all-regression-tests.cjs, which executes the identical 99-test canonical manifest. Never weaken tests, remove coverage, skip failures, or report unrun checks as passing.

Verify the original user flow and relevant edge cases. Report trigger, cause, repair, verification, and limitations. Stage only repair-related files or hunks when committing.
