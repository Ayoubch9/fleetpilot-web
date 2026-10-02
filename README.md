# MileVoxa Web v4.4.0 — Free Public Beta

MileVoxa is configured for a free public beta so truckers can use the core web
product, share honest feedback, and help improve the workflow before paid plans
are announced.

## Beta access

Central switch:

`MILEVOXA_PUBLIC_BETA=true`

The helper in `src/lib/beta-access.ts` is the single entitlement source for the
beta phase. While enabled:

- authenticated company users have beta access regardless of legacy trial age
- expired legacy trials are not paywalled
- new users do not need checkout or a payment card
- `/api/billing/checkout` refuses to create new paid checkout sessions
- existing billing records are left untouched
- disabling beta does not create charges or auto-enroll users into paid plans

If beta is later disabled, existing paid/trial access logic remains available as
a future fallback and still requires explicit checkout for new paid enrollment.

## Feedback

Run `supabase_public_beta_feedback_v4_4_0.sql`.

Authenticated users can submit feedback, but normal users cannot read feedback
rows. Internal review is limited to privileged backend/Supabase admin access.

Feedback is available from the app sidebar and Dashboard. A dismissible prompt
also appears after a settlement week contains a completed/delivered load.

## Testimonials follow-up

v4.4.0 does **not** auto-publish testimonials. The milestone prompt sends users
to private product feedback only. A future testimonial workflow should use a
separate explicit `permission_to_publish` consent and an admin approval step
before any quote is published.

## Billing safety

Before production rollout run the read-only audit:

`supabase_public_beta_billing_audit_v4_4_0.sql`

If it returns active Stripe subscriptions, decide how those paying customers
should be treated. v4.4.0 does not cancel, refund, modify, or create real
subscriptions.

## Local setup

```powershell
cd C:\projects\fleetpilot_web
npm install
npm run typecheck
npm run build
npm run dev
```

See `SETUP.txt` and `DEPLOYMENT_CHECKLIST.md` for the full review flow.
