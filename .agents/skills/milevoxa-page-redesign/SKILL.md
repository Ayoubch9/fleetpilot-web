---
name: milevoxa-page-redesign
description: Redesign MileVoxa pages and components with the approved visual system while preserving behavior. Use for layout, typography, spacing, and responsive polish.
---

# milevoxa-page-redesign

Read root AGENTS.md and inspect the target page, shared shell, and existing styles. Preserve the existing architecture and Next.js/Supabase setup.

For layout-only work, do not change Supabase queries, auth, GA4, formulas, routes, imports/exports, or business rules unless explicitly requested. Prefer existing CSS hooks and markup styling within this boundary. Preserve handlers, state logic, real data, links, loading/error/empty states, and font loading. If a visual approach requires a protected change, explain the specific dependency and obtain scope clarification.

Reuse #102238, #0B1730, #10B981, #059669, #34D399, Plus Jakarta Sans, and JetBrains Mono according to current conventions. Preserve package version 4.7.1. Reuse components rather than creating a parallel design system.

Verify desktop/mobile layout, keyboard focus, contrast, overflow, tables, forms, modals, and navigation relevant to the page. Compare before/after with real and empty states. Review the diff for unintended behavior changes.
Run from the repository root:
```sh
npm run typecheck
npm run lint
npm run build
npm run test:regression
git diff --check
```
Inspect pretest:regression first in a dirty tree: it invokes the existing stale-test cleanup. To avoid cleanup side effects, use node scripts/run-all-regression-tests.cjs, which executes the identical 99-test canonical manifest. Never weaken tests, remove coverage, skip failures, or report unrun checks as passing.

Report changed surfaces, visual verification, check results, and remaining issues.
