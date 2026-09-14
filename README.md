# FleetPilot Web v3.2.0 — Fuel Analytics Operational Pass

Fuel Analytics is now fully interactive.

## Functional analytics tabs
- Overview
- By Truck
- By Location
- By Vendor

Each view is driven by the currently filtered fuel transactions.

### By Truck
Shows:
- transactions
- gallons
- average price / gallon
- total spend
- fuel-spend share

### By Vendor
Shows the same operating metrics grouped by fuel vendor.

### By Location
The current `expenses` schema does not contain a dedicated fuel-location
column. This view therefore uses the transaction `description` as the
location when available, and falls back to the vendor. No fake location data
is created.

## Functional filters
- live Search
- Truck
- Date Range
- Sort By:
  - Date Newest / Oldest
  - Cost Highest / Lowest
  - Gallons Highest
  - Price/Gallon Highest

The Date Range popup is rendered in a body portal so it cannot be clipped.

## Data recalculation
The active filters now update:
- Total Fuel Cost
- Total Gallons
- Avg. Price/Gallon
- Avg. MPG
- trend chart
- truck donut
- truck/vendor/location breakdowns
- transactions table
- Fuel Insights

The default period remains the selected FleetPilot week. A custom Date Range
can expand or narrow Fuel Analytics beyond that week.

No SQL changes are required.
