# MileVoxa Web v4.7.0 — Launch Hardening

This package is a launch-hardening release, not a feature release.

## Code changes

- Upgrades Next.js and eslint-config-next from 16.3.4 to 16.3.8.
- Standardizes canonical URLs on https://www.milevoxa.com.
- Permanently redirects the apex host milevoxa.com to www.
- Adds baseline production security headers.
- Adds X-Robots-Tag noindex/nofollow + private/no-store headers to authenticated/app routes.
- Updates robots.txt strategy so crawlers can see noindex headers; API/auth endpoints remain blocked.
- Adds /contact to sitemap.
- Adds developer/operator disclosure support.
- Expands Privacy Policy for technical/browser data, cookies/local/session storage, Stripe, and regional privacy requests.
- Expands Terms for operator/contact, prohibited abuse, reverse engineering limits, IP/license language, and Stripe.
- Adds a prominent external Request Account Deletion pathway on /data-deletion.
- Adds /.well-known/security.txt.
- Updates stale regression tests to the current Public Beta/product contract.
- Adds test:launch-hardening, test:regression, and audit:prod scripts.

## Required environment verification before production

Set this to the exact developer/business name shown in Google Play:

NEXT_PUBLIC_MILEVOXA_DEVELOPER_NAME=MileVoxa

If the Play Console developer/business name is not exactly "MileVoxa", change it before the production build.

## Local validation

From C:\projects\fleetpilot_web:

rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run test:signout-feedback
npm run test:launch-hardening
npm run test:regression
npm run build
npm run audit:prod

Do not run npm audit fix --force automatically. Review any remaining findings individually.

## Manual launch blockers that code cannot prove

1. Run the v4.6.6 sign-out feedback SQL migration in Supabase if not already applied.
2. Test account deletion with a staging user containing loads, expenses, receipts, documents, feedback, and storage objects.
3. Verify two-company tenant isolation (Company A cannot read/write Company B).
4. Verify www.milevoxa.com TLS and that milevoxa.com permanently redirects to www.
5. Verify /robots.txt, /sitemap.xml, /privacy, /terms, /data-deletion and /contact in production.
6. Complete Google Play Data Safety from the final Android build and every included SDK/permission.
7. Confirm Google Play Target Audience, App Access test credentials, account-deletion URL, Financial features declaration, Content Rating, and Ads declaration.
8. Submit https://www.milevoxa.com/sitemap.xml in Google Search Console after production is live.
