MileVoxa Web v4.6.1

UI-only sidebar polish:
- Load Decision label now uses the same typography as the other sidebar navigation items.
- Load Decision icon is normalized to the same 20px size as standard sidebar icons.
- No Load Decision logic, backend, Action Center, legal/privacy, dependencies, or other features changed.

Run:
rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run build
