# MileVoxa Web v4.3.18 — Pricing TypeScript Fix

Built on v4.3.17.

## Fix
`src/app/pricing/pricing-plans.tsx` now defines an explicit shared `PricingPlan`
type with `popular?: boolean`.

This resolves the TypeScript error where `plan.popular` was not available on
the Solo and Pro members of the inferred union.

No pricing content, layout, billing behavior, auth behavior, or trial logic was
changed.
