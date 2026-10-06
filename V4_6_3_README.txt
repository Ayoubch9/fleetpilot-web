MileVoxa v4.6.3 — Load Decision sidebar exact fix

Root cause:
v4.6.2 added an href-specific CSS override that forced Load Decision to 16px/600 and its icon to 20px.
The real shared SideItem component used by Dashboard, Loads, Trucks, Expenses, etc. is:
- text 11px
- font weight 500
- icon 15x15
- same height/gap/padding for every item

Fix:
All /load-decision-specific CSS overrides were removed.
Load Decision now renders through the exact same SideItem component and Icon sizing as every neighboring Operations item.

No business logic/backend changes.

Run:
rmdir /s /q .next
npm install
npm run typecheck
npm run test:action-center
npm run test:load-decision
npm run build
