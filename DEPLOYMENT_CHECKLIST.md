# MileVoxa Web — Public Beta Review Checklist

## 1. Environment
Set these in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or publishable key
- `MILEVOXA_PUBLIC_BETA=true`

Existing/future billing variables may remain configured server-side. Do not expose
secret Stripe or Supabase service-role values to the browser.

## 2. Supabase
Run:

- `supabase_public_beta_feedback_v4_4_0.sql`

Confirm RLS remains enabled on business tables and no broad anonymous policies exist.
The feedback table allows authenticated INSERT only; normal users have no SELECT policy.

## 3. Billing safety review
Run the read-only file:

- `supabase_public_beta_billing_audit_v4_4_0.sql`

If rows show active/paid Stripe subscriptions, decide how those paying customers should
be treated before production rollout. This release intentionally does not modify them.

With `MILEVOXA_PUBLIC_BETA=true`, verify `/api/billing/checkout` refuses to create a
checkout session. Existing billing portal/webhook code remains available for existing
billing relationships and future use.

## 4. Local checks

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

## 5. Beta access smoke test
Use local/staging accounts only:

- New email signup → Dashboard with no card/checkout
- New Google signup/onboarding → Dashboard with no card/checkout
- Existing active trial user → Dashboard
- Existing expired trial user → Dashboard
- Settings → Beta Access says `Free Beta Access`
- No trial countdown/expiration prompt during beta
- Pricing shows only free public beta offer
- Paid checkout cannot start while beta is enabled

## 6. Core workflow regression
Check:

- Loads CRUD / Telegram import
- Trucks
- Expenses
- Reimbursements
- Maintenance
- Weekly Odometer
- Weekly Settlement
- Fuel Analytics
- Reports PDF/CSV
- Documents
- Pilot AI
- Security Deposit

## 7. Feedback
Test:

- Sidebar `Send Feedback`
- Dashboard `Send Feedback`
- Bug / Suggestion / Confusing experience / Other
- Required message validation
- Optional page context
- Optional contact permission
- Success/error states
- normal authenticated user cannot read feedback rows

## 8. Milestone prompt
After a settlement week containing a COMPLETED/DELIVERED load:

- gentle beta feedback prompt appears
- prompt is dismissible
- dismissal persists in that browser
- prompt never makes beta access conditional on feedback

## 9. Responsive review
Check desktop/tablet/mobile and supported light/dark surfaces for beta badges,
feedback modal, pricing, signup, settings, and settlement prompt.

## 10. Production deployment
This package is prepared for review only. Do not deploy or change real billing until:

- billing audit is reviewed
- active paying-customer treatment is decided if applicable
- staging verification is complete
