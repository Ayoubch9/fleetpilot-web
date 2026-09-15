# FleetPilot Web v3.4.0 — Full Mobile App Responsive Pass

FleetPilot now has an app-like phone experience while preserving the existing
desktop design.

## Mobile application shell
- fixed bottom navigation:
  - Home
  - Loads
  - Trucks
  - Expenses
  - More
- More opens a native-style bottom sheet with:
  - Maintenance
  - Reimbursements
  - Weekly Settlement
  - Fuel Analytics
  - Reports
  - Pilot AI
  - Documents
  - Notifications
  - Settings
- mobile header remains compact
- Global Search is available directly below the header
- the global Week Selector is available on mobile
- safe-area support for modern iPhones

## App pages
Responsive treatment applied globally to:
- Dashboard
- Loads
- Trucks
- Expenses
- Maintenance
- Reimbursements
- Weekly Settlement
- Fuel Analytics
- Reports
- Documents
- Pilot AI
- Settings
- Load Profitability
- Truck Profiles

Mobile behavior includes:
- 2-column KPI cards
- stacked main/right-rail layouts
- swipeable tabs
- compact two-column filters
- full-width search
- mobile Sort controls
- touch-safe table scrolling
- sticky first table column
- touch-friendly pagination
- forms transformed into mobile bottom sheets
- portal menus/popovers constrained to the viewport

## Public website
Responsive treatment also applied to:
- Homepage
- Pricing
- Free Tools
- 14-day-trial CTAs
- all six public calculators
- Lease Operator / Contractor calculator

The Free Tools selector becomes a horizontal swipe row on phones and
calculators become one-column forms.

## Mobile browser improvements
- 16px form controls on phone to avoid iOS Safari input zoom
- `dvh` modal sizing
- safe-area spacing
- touch momentum scrolling
- horizontal scrollbars hidden while preserving swipe

No SQL or Supabase changes are required.
