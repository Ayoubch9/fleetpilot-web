# FleetPilot Web v3.0.3 — Reimbursement TypeScript Build Fix

Fixes the v3.0.2 production type-check errors introduced by the standalone
reimbursement model.

Changes:
- reimbursement `expense_id` remains nullable
- vendor filtering now uses the null-safe `linkedExpense(row)` helper
- the page-level `Expense.truck_id` type is now consistently
  `string | null` instead of optional
- AddReimbursementForm and ReimbursementActions now receive the same Expense
  shape as the page

The mobile-style reimbursement behavior from v3.0.2 is unchanged:
- existing expense link is optional
- standalone reimbursement supported
- category
- truck assignment
- reference / statement
- date
- amount
- notes
- safe CSV export

The Supabase migration from v3.0.2 is still required once:
`supabase_reimbursement_mobile_model_setup.sql`
