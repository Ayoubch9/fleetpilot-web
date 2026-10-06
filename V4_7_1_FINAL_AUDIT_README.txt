MileVoxa Web v4.7.1 — Final Audit Hotfix

The v4.7.0 production build itself passed. This update addresses the remaining audit items:

SECURITY
- Forces sharp 0.35.5 (patched for GHSA-wq5f-xc86-pv6w).
- Forces source-map-js 1.2.2 (patched for GHSA-68fv-2mgg-jv7q).

TEST CLEANUP
- launch-hardening test no longer fails just because .env.example is missing in an overlaid Windows folder.
- Adds a visible MILEVOXA_ENV_EXAMPLE.txt.
- test:regression now uses a canonical manifest.
- Five obsolete historical regression files are removed automatically if they remain from older local project copies.

IF COPYING OVER THE EXISTING WINDOWS FOLDER
Run first:
powershell -ExecutionPolicy Bypass -File .\APPLY_V4_7_1_FINAL_AUDIT.ps1

Then run:
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run test:signout-feedback
npm run test:launch-hardening
npm run test:regression
npm run build
npm run audit:prod

Do not run npm audit fix --force.
