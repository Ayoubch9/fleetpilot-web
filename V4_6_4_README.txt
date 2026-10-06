MileVoxa v4.6.4 — Mobile ActivePage type hotfix

Fix:
- Added "decision" to the ActivePage union in src/components/mobile-app-navigation.tsx.
- This makes MobileAppNavigation accept the same Load Decision active-page value as app-shell.tsx.
- No UI, calculation, backend, legal/privacy, or dependency changes.

Run:
rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run build

Security note:
Do not run npm audit fix --force as part of this hotfix. Review npm audit separately after the build is clean.
