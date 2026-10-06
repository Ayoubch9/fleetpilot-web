MileVoxa v4.6.5 — Load Decision sidebar exact match

Root cause:
The premium sidebar CSS in globals.css explicitly applies its final typography
to Dashboard, Loads, Trucks, Expenses, Maintenance, etc., but /load-decision
was missing from those selector lists.

Fix:
- Added /load-decision to the exact same "Main nav rows" selector group.
- Added /load-decision to the exact same "Inactive items" selector group.
- Removed any old route-specific Load Decision overrides.
- Shared icon styling remains unchanged.

Load Decision now receives exactly the same sidebar styling as Loads/Trucks:
- 12px font size
- 500 weight
- -0.01em letter spacing
- 39px row height
- 9px radius
- 11px gap
- 13px horizontal padding
- same inactive color
- same 16px shared icon rule

No backend/business logic/legal/dependency changes.

Run:
rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run build
