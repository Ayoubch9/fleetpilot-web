---
name: regression-guardian
description: Run and diagnose MileVoxa canonical regressions and protect coverage. Use when validating changes or investigating test failures.
---

# regression-guardian

Read root AGENTS.md. Capture working-tree status and inspect package.json, scripts/regression-test-manifest.json, and scripts/run-all-regression-tests.cjs. The 4.7.1 baseline contains 99 canonical tests; do not substitute a glob of historical test files.
Run from the repository root:
```sh
npm run typecheck
npm run lint
npm run build
npm run test:regression
git diff --check
```
Inspect pretest:regression first in a dirty tree: it invokes the existing stale-test cleanup. To avoid cleanup side effects, use node scripts/run-all-regression-tests.cjs, which executes the identical 99-test canonical manifest. Never weaken tests, remove coverage, skip failures, or report unrun checks as passing.

Record failing tests and exit statuses. Re-run affected tests directly with node scripts/<actual-manifest-filename>, then rerun the full canonical suite after a fix. Compare against a baseline when needed before labeling failures pre-existing.

Repair implementation defects. Never delete manifest entries, loosen assertions, suppress nonzero exits, or fabricate passing results. An explicitly approved behavior change may need meaningful new expectations, while preserving unaffected contracts and coverage. Add tests beyond 99 when warranted; do not reduce the baseline.

Summarize passed/failed counts, observed causes, and blockers. Preserve unrelated dirty files.
