# MileVoxa Web v4.3.9 — Loads Empty State + Shared Promo Banner

Built on v4.3.8.

## Loads
Verified the existing `Add Load` quick action is on the MileVoxa primary green
contract.

The table empty state is now a proper card with:
- truck icon
- `No loads found`
- 14px `#64748B` supporting text
- green `Add your first load` button

The button opens the existing Add Load flow via the same application event used
by Loads Quick Actions.

## Trucks
Verified `Add Truck` uses the primary green contract.

Truck status filters already use the shared `AppTabs` component. The active
underline and count pill are explicitly kept on the green contract:
- underline `#16853B`
- active count background `#EAF6EC`
- active count text `#126F32`

## Shared PromoBanner
Added:
`src/components/promo-banner.tsx`

Props:
- `headline`
- `subtext`
- `cta`

The repeated truck-photo promo treatment is now centralized and used by:
- Trucks
- Maintenance
- Settlement
- Reimbursements
- Security Deposit

Each page supplies page-specific headline, supporting copy, and CTA.

The old page-specific promo markup for Trucks, Maintenance, Settlement, and
Reimbursements was removed.
