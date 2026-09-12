# FleetPilot Web v1.3.1 — Production Type Fix

Fixes the production TypeScript error on the Dashboard Pilot AI panel.

## Fix
`SectionPanel.title` now accepts `React.ReactNode` instead of only `string`.
This matches actual usage because the Pilot AI title contains a title plus the Beta badge.

This is a type-only correction and does not change the visual design or business logic.

Recommended validation:
- `npm run typecheck`
- `npm run build`
- `npm run dev`
- open `/health`
