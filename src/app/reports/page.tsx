import KpiTile from "@/components/kpi-tile";
import AppShell from "@/components/app-shell";
import { formatMoney, formatPercent } from "@/lib/format";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import { effectiveLoadStatus, isCompletedLoadStatus } from "@/lib/load-domain";
import { chartCategoryColor } from "@/lib/chart-palette";
import {
  dbDate,
  monday,
  plusDays,
} from "@/lib/fleetpilot-week";
import ReportActions from "./report-actions";
import ReportPeriodControls from "./report-period-controls";

type Params = {
  period?: string;
  date?: string;
  from?: string;
  to?: string;
  truck?: string;
};

type Load = {
  id: string;
  truck_id: string | null;
  load_number: string | null;
  rate: number | string | null;
  loaded_miles: number | string | null;
  deadhead_miles: number | string | null;
  status: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
};

type Expense = {
  id: string;
  truck_id: string | null;
  amount: number | string | null;
  category: string | null;
  vendor: string | null;
  description: string | null;
  expense_date: string | null;
  gallons: number | string | null;
  fuel_price_per_gallon: number | string | null;
};

type Reimbursement = {
  id: string;
  truck_id: string | null;
  amount: number | string | null;
  reimbursement_date: string | null;
};

type FixedExpense = {
  amount: number | string | null;
  name?: string | null;
  is_active?: boolean | null;
  active?: boolean | null;
};

type Odometer = {
  truck_id: string | null;
  week_start: string | null;
  start_odometer: number | string | null;
  end_odometer: number | string | null;
  rate_per_mile?: number | string | null;
};

type Settings = {
  revenue_fee_percent?: number | string | null;
  mileage_fee_per_mile?: number | string | null;
  is_revenue_fee_active?: boolean | null;
  is_mileage_fee_active?: boolean | null;
};

type Truck = {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
};

type Maintenance = {
  truck_id: string | null;
  service_date: string | null;
  service_type: string | null;
  vendor: string | null;
  cost: number | string | null;
};

const n = (value: unknown) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
const money = (value: number) => formatMoney(value);

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const period = normalizePeriod(params.period);
  const anchor = parseDate(params.date) || new Date();

  const range =
    period === "custom"
      ? customRange(params.from, params.to)
      : standardRange(period, anchor);

  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const [
    { data: loadData },
    { data: expenseData },
    { data: reimbursementData },
    { data: fixedData },
    { data: odometerData },
    { data: settingsData },
    { data: truckData },
    { data: maintenanceData },
  ] = await Promise.all([
    supabase
      .from("loads")
      .select("id, truck_id, load_number, rate, loaded_miles, deadhead_miles, status, pickup_date, delivery_date"),
    supabase
      .from("expenses")
      .select("id, truck_id, amount, category, vendor, description, expense_date, gallons, fuel_price_per_gallon"),
    supabase
      .from("reimbursements")
      .select("id, truck_id, amount, reimbursement_date"),
    supabase.from("weekly_fixed_expenses").select("*"),
    supabase
      .from("weekly_odometer_records")
      .select("truck_id, week_start, start_odometer, end_odometer, rate_per_mile"),
    supabase.from("company_fee_settings").select("*").limit(1),
    supabase.from("trucks").select("id, unit_number, make, model").order("unit_number"),
    supabase
      .from("maintenance_records")
      .select("truck_id, service_date, service_type, vendor, cost"),
  ]);

  const now = new Date();
  const trucks = (truckData ?? []) as Truck[];
  const selectedTruck =
    params.truck && params.truck !== "all" ? params.truck : null;

  const allLoads = ((loadData ?? []) as Load[]).map((load) => ({
    ...load,
    status: effectiveLoadStatus(load.status, load.pickup_date, now),
  }));
  const allExpenses = (expenseData ?? []) as Expense[];
  const allReimbursements = (reimbursementData ?? []) as Reimbursement[];
  const fixed = (fixedData ?? []) as FixedExpense[];
  const odometers = (odometerData ?? []) as Odometer[];
  const settings = ((settingsData ?? []) as Settings[])[0] || {};
  const allMaintenance = (maintenanceData ?? []) as Maintenance[];

  const loads = allLoads.filter(
    (load) =>
      inRange(load.pickup_date, range.start, range.end) &&
      (!selectedTruck || load.truck_id === selectedTruck)
  );
  const expenses = allExpenses.filter(
    (expense) =>
      inRange(expense.expense_date, range.start, range.end) &&
      (!selectedTruck || expense.truck_id === selectedTruck)
  );
  const reimbursements = allReimbursements.filter(
    (row) =>
      inRange(row.reimbursement_date, range.start, range.end) &&
      (!selectedTruck || row.truck_id === selectedTruck)
  );
  const maintenance = allMaintenance.filter(
    (row) =>
      inRange(row.service_date, range.start, range.end) &&
      (!selectedTruck || row.truck_id === selectedTruck)
  );

  const activeFixed = fixed.filter((row) =>
    typeof row.is_active === "boolean"
      ? row.is_active
      : typeof row.active === "boolean"
        ? row.active
        : true
  );

  const weeklyFixed = activeFixed.reduce((sum, row) => sum + n(row.amount), 0);
  const weeksInPeriod = countWeeks(range.start, range.end);
  const fixedTotal = selectedTruck ? 0 : weeklyFixed * weeksInPeriod;

  const grossRevenue = loads.reduce((sum, load) => sum + n(load.rate), 0);
  const loadedMiles = loads.reduce((sum, load) => sum + n(load.loaded_miles), 0);
  const deadheadMiles = loads.reduce((sum, load) => sum + n(load.deadhead_miles), 0);
  const totalMiles = loadedMiles + deadheadMiles;

  const variableExpenses = expenses.reduce((sum, row) => sum + n(row.amount), 0);
  const reimbursementTotal = reimbursements.reduce((sum, row) => sum + n(row.amount), 0);

  const revenueFeePercent =
    settings.revenue_fee_percent == null ? 15 : n(settings.revenue_fee_percent);
  const mileageFeeRate =
    settings.mileage_fee_per_mile == null ? 0.15 : n(settings.mileage_fee_per_mile);
  const revenueFeeActive =
    settings.is_revenue_fee_active == null
      ? true
      : Boolean(settings.is_revenue_fee_active);
  const mileageFeeActive =
    settings.is_mileage_fee_active == null
      ? true
      : Boolean(settings.is_mileage_fee_active);

  const revenueFee = selectedTruck
    ? 0
    : revenueFeeActive
      ? grossRevenue * (revenueFeePercent / 100)
      : 0;

  const selectedOdometers = odometers.filter((row) => {
    if (!row.week_start) return false;
    if (selectedTruck && row.truck_id !== selectedTruck) return false;
    return inRange(row.week_start, monday(range.start), range.end);
  });

  const odometerMiles = selectedOdometers.reduce(
    (sum, row) =>
      sum + Math.max(n(row.end_odometer) - n(row.start_odometer), 0),
    0
  );

  const mileageFee = mileageFeeActive
    ? selectedOdometers.reduce((sum, row) => {
        const miles = Math.max(n(row.end_odometer) - n(row.start_odometer), 0);
        const rate =
          row.rate_per_mile == null ? mileageFeeRate : n(row.rate_per_mile);
        return sum + miles * rate;
      }, 0)
    : 0;

  const totalExpenses =
    variableExpenses - reimbursementTotal + fixedTotal + revenueFee + mileageFee;
  const netProfit = grossRevenue - totalExpenses;
  const profitMargin =
    grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : null;

  const completedLoads = allLoads.filter((load) => {
    if (!isCompletedLoadStatus(load.status, load.pickup_date, now)) {
      return false;
    }

    if (selectedTruck && load.truck_id !== selectedTruck) {
      return false;
    }

    const completionDate = load.delivery_date || load.pickup_date;
    return inRange(completionDate, range.start, range.end);
  });

  const fuelExpenses = expenses.filter(
    (row) => (row.category || "").toLowerCase() === "fuel"
  );
  const fuelCost = fuelExpenses.reduce((sum, row) => sum + n(row.amount), 0);
  const fuelGallons = fuelExpenses.reduce((sum, row) => sum + n(row.gallons), 0);
  const avgFuelPrice = fuelGallons > 0 ? fuelCost / fuelGallons : 0;
  const maintenanceCost = maintenance.reduce((sum, row) => sum + n(row.cost), 0);

  const categoryMap = new Map<string, number>();
  for (const row of expenses) {
    const category = (row.category || "Other").trim() || "Other";
    categoryMap.set(category, (categoryMap.get(category) || 0) + n(row.amount));
  }

  const expenseDetails = [
    ...[...categoryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, amount], index) => ({
        label,
        amount,
        note: "Recorded expense transactions",
        color: chartCategoryColor(index),
      })),
    {
      label: "Fixed Expenses",
      amount: fixedTotal,
      note: selectedTruck
        ? "Company-level fixed costs excluded from truck-only report"
        : `${weeksInPeriod} reporting ${weeksInPeriod === 1 ? "week" : "weeks"}`,
      color: chartCategoryColor(categoryMap.size),
    },
    {
      label: "Company Revenue Fee",
      amount: revenueFee,
      note: `${formatPercent(revenueFeePercent)} of gross revenue`,
      color: chartCategoryColor(categoryMap.size + 1),
    },
    {
      label: "Odometer Mileage Fee",
      amount: mileageFee,
      note: `${odometerMiles.toLocaleString()} odometer miles`,
      color: chartCategoryColor(categoryMap.size + 2),
    },
  ].filter((row) => row.amount > 0);

  const truckRows = trucks
    .filter((truck) => !selectedTruck || truck.id === selectedTruck)
    .map((truck) => {
      const truckLoads = loads.filter((load) => load.truck_id === truck.id);
      const truckExpenses = expenses.filter((row) => row.truck_id === truck.id);
      const truckReimbursements = reimbursements.filter(
        (row) => row.truck_id === truck.id
      );
      const revenue = truckLoads.reduce((sum, row) => sum + n(row.rate), 0);
      const expense = truckExpenses.reduce((sum, row) => sum + n(row.amount), 0);
      const recovered = truckReimbursements.reduce((sum, row) => sum + n(row.amount), 0);
      const miles = truckLoads.reduce(
        (sum, row) => sum + n(row.loaded_miles) + n(row.deadhead_miles),
        0
      );
      return {
        id: truck.id,
        unit: truck.unit_number,
        revenue,
        expenses: expense - recovered,
        profit: revenue - (expense - recovered),
        miles,
        completedLoads: completedLoads.filter((row) => row.truck_id === truck.id).length,
      };
    })
    .filter((row) => row.revenue || row.expenses || row.completedLoads)
    .sort((a, b) => b.profit - a.profit);


const reportDates = calendarDays(range.start, range.end);
const weekBookingDate = new Map<string, string>();

for (const date of reportDates) {
  const weekKey = dbDate(monday(date));
  if (!weekBookingDate.has(weekKey)) {
    weekBookingDate.set(weekKey, dbDate(date));
  }
}

const odometerFeeByWeek = new Map<string, number>();
const odometerMilesByWeek = new Map<string, number>();

for (const row of selectedOdometers) {
  if (!row.week_start) continue;

  const weekDate = parseDate(row.week_start) || range.start;
  const weekKey = dbDate(monday(weekDate));
  const miles = Math.max(
    n(row.end_odometer) - n(row.start_odometer),
    0
  );
  const rate =
    row.rate_per_mile == null
      ? mileageFeeRate
      : n(row.rate_per_mile);

  odometerMilesByWeek.set(
    weekKey,
    (odometerMilesByWeek.get(weekKey) || 0) + miles
  );

  if (mileageFeeActive) {
    odometerFeeByWeek.set(
      weekKey,
      (odometerFeeByWeek.get(weekKey) || 0) + miles * rate
    );
  }
}

const dailyRows = reportDates.map((date) => {
  const dateKey = dbDate(date);
  const weekKey = dbDate(monday(date));

  const dayLoads = loads.filter(
    (row) => (row.pickup_date || "").slice(0, 10) === dateKey
  );
  const dayExpenses = expenses.filter(
    (row) => (row.expense_date || "").slice(0, 10) === dateKey
  );
  const dayReimbursements = reimbursements.filter(
    (row) => (row.reimbursement_date || "").slice(0, 10) === dateKey
  );
  const dayMaintenance = maintenance.filter(
    (row) => (row.service_date || "").slice(0, 10) === dateKey
  );

  const revenue = dayLoads.reduce(
    (sum, row) => sum + n(row.rate),
    0
  );
  const variable = dayExpenses.reduce(
    (sum, row) => sum + n(row.amount),
    0
  );
  const recovered = dayReimbursements.reduce(
    (sum, row) => sum + n(row.amount),
    0
  );
  const miles = dayLoads.reduce(
    (sum, row) =>
      sum + n(row.loaded_miles) + n(row.deadhead_miles),
    0
  );

  const bookWeeklyCosts =
    weekBookingDate.get(weekKey) === dateKey;

  const fixed =
    !selectedTruck && bookWeeklyCosts ? weeklyFixed : 0;

  const revenueFeeForDay =
    !selectedTruck && revenueFeeActive
      ? revenue * (revenueFeePercent / 100)
      : 0;

  const odometerFeeForDay = bookWeeklyCosts
    ? odometerFeeByWeek.get(weekKey) || 0
    : 0;

  const odometerMilesForDay = bookWeeklyCosts
    ? odometerMilesByWeek.get(weekKey) || 0
    : 0;

  const costs =
    variable -
    recovered +
    fixed +
    revenueFeeForDay +
    odometerFeeForDay;

  return {
    date: dateKey,
    label: date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    revenue,
    variable,
    reimbursements: recovered,
    fixed,
    revenueFee: revenueFeeForDay,
    odometerFee: odometerFeeForDay,
    odometerMiles: odometerMilesForDay,
    costs,
    net: revenue - costs,
    loads: dayLoads.length,
    miles,
    maintenance: dayMaintenance.length,
  };
});

const reportLabel = periodLabel(period, range.start, range.end);
const anchorText = dbDate(anchor);


const exportRows: string[][] = [
  ["MileVoxa Business Report", reportLabel],
  ["Metric", "Value"],
  ["Gross Revenue", grossRevenue.toFixed(2)],
  ["Variable Expenses", variableExpenses.toFixed(2)],
  ["Reimbursements", reimbursementTotal.toFixed(2)],
  ["Fixed Expenses", fixedTotal.toFixed(2)],
  ["Company Revenue Fee", revenueFee.toFixed(2)],
  ["Odometer Mileage Fee", mileageFee.toFixed(2)],
  ["Total Expenses", totalExpenses.toFixed(2)],
  ["Net Profit", netProfit.toFixed(2)],
  ["Completed Loads", String(completedLoads.length)],
  ["Total Miles", String(totalMiles)],
  ["Odometer Miles", String(odometerMiles)],
  ["Fuel Cost", fuelCost.toFixed(2)],
  ["Fuel Gallons", fuelGallons.toFixed(2)],
  [],
  [
    "Day-by-Day",
    "Revenue",
    "Variable Expenses",
    "Reimbursements",
    "Fixed Expenses",
    "Revenue Fee",
    "Odometer Fee",
    "Total Costs",
    "Net Profit",
    "Loads",
    "Miles",
    "Maintenance Services",
  ],
  ...dailyRows.map((row) => [
    row.date,
    row.revenue.toFixed(2),
    row.variable.toFixed(2),
    row.reimbursements.toFixed(2),
    row.fixed.toFixed(2),
    row.revenueFee.toFixed(2),
    row.odometerFee.toFixed(2),
    row.costs.toFixed(2),
    row.net.toFixed(2),
    String(row.loads),
    row.miles.toFixed(0),
    String(row.maintenance),
  ]),
  [],
  ["Truck", "Revenue", "Expenses", "Profit", "Miles", "Completed Loads"],
  ...truckRows.map((row) => [
    `#${row.unit}`,
    row.revenue.toFixed(2),
    row.expenses.toFixed(2),
    row.profit.toFixed(2),
    row.miles.toFixed(0),
    String(row.completedLoads),
  ]),
];

  return (
    <AppShell
      active="reports"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-tool-page fp-reports-v2">
        <div className="fp-tool-heading">
          <div>
            <h1>Reports</h1>
            <p>
              Review revenue, full operating costs, fleet activity and profitability.
            </p>
          </div>
          <ReportActions
            trucks={trucks.map((truck) => ({
              id: truck.id,
              unit: truck.unit_number,
            }))}
            companyName={companyName}
            periodLabel={reportLabel}
            exportRows={exportRows}
          />
        </div>

        <ReportPeriodControls
          period={period}
          anchor={anchorText}
          periodLabel={reportLabel}
        />

        <div className="fp-report-kpis fp-report-kpis-expanded">
          <KpiTile label="Gross Revenue" value={money(grossRevenue)} note={reportLabel} />
          <KpiTile label="Total Expenses" value={money(totalExpenses)} note="All operating costs after reimbursements" />
          <KpiTile label="Net Profit" value={money(netProfit)} note={profitMargin == null ? "No revenue in period" : `${formatPercent(profitMargin)} margin`} />
          <KpiTile
            label="Completed Loads"
            value={String(completedLoads.length)}
            note={`Delivered / completed in ${reportLabel}`}
          />
          <KpiTile label="Total Miles" value={`${totalMiles.toLocaleString()} mi`} note={`${deadheadMiles.toLocaleString()} deadhead`} />
          <KpiTile label="Revenue / Mile" value={totalMiles > 0 ? money(grossRevenue / totalMiles) : "n/a"} note="Gross revenue ÷ load miles" />
        </div>


<div className="fp-report-meta-strip">
  <Fact label="Reporting Period" value={reportLabel} />
  <Fact
    label="Calendar Days"
    value={`${dailyRows.length} ${dailyRows.length === 1 ? "day" : "days"}`}
  />
  <Fact
    label="Trucks in Report"
    value={selectedTruck ? "1 truck" : `${trucks.length} trucks`}
  />
  <Fact label="Loads" value={String(loads.length)} />
  <Fact
    label="Expense Transactions"
    value={String(expenses.length)}
  />
  <Fact
    label="Odometer Records"
    value={String(selectedOdometers.length)}
  />
</div>

<div className="fp-report-content-stack">
  <section className="fp-panel fp-report-section-panel">
    <div className="fp-report-section-heading">
      <span>BUSINESS OVERVIEW</span>
      <h2>{reportLabel}</h2>
      <p>
        Full business costs include recorded expenses, weekly fixed
        expenses, company revenue fees and odometer mileage fees.
      </p>
    </div>

    <div className="fp-report-business-grid">
      <Metric
        label="Variable Expenses"
        value={money(variableExpenses)}
        note="Transactions recorded on Expenses"
      />
      <Metric
        label="Reimbursements"
        value={money(reimbursementTotal)}
        note="Recovered money offsets expenses"
        good
      />
      <Metric
        label="Fixed Expenses"
        value={money(fixedTotal)}
        note={
          selectedTruck
            ? "Company-level costs excluded from truck-only report"
            : `${weeksInPeriod} weekly cycle${weeksInPeriod === 1 ? "" : "s"}`
        }
      />
      <Metric
        label="Company Revenue Fee"
        value={money(revenueFee)}
        note={`${formatPercent(revenueFeePercent)} rate`}
      />
      <Metric
        label="Odometer Mileage Fee"
        value={money(mileageFee)}
        note={`${odometerMiles.toLocaleString()} odometer miles`}
      />
      <Metric
        label="Fuel Cost"
        value={money(fuelCost)}
        note={
          fuelGallons > 0
            ? `${fuelGallons.toFixed(1)} gal · ${money(avgFuelPrice)}/gal avg`
            : "Add gallons for deeper fuel reporting"
        }
      />
      <Metric
        label="Maintenance Activity"
        value={`${maintenance.length} services`}
        note={`${money(maintenanceCost)} recorded service cost`}
      />
      <Metric
        label="Deadhead"
        value={
          totalMiles > 0
            ? formatPercent((deadheadMiles / totalMiles) * 100)
            : "0%"
        }
        note={`${deadheadMiles.toLocaleString()} miles`}
      />
    </div>
  </section>

  <section className="fp-panel fp-report-section-panel">
    <div className="fp-section-title fp-report-tight-title">
      <div>
        <h2>Expense Details</h2>
        <small>Every major cost source used in this report</small>
      </div>
    </div>

    <div className="fp-report-expense-ledger">
      {expenseDetails.map((row) => (
        <div key={row.label}>
          <span
            className="fp-report-expense-dot"
            style={{ background: row.color }}
          />
          <div>
            <strong>{row.label}</strong>
            <small>{row.note}</small>
          </div>
          <b>{money(row.amount)}</b>
        </div>
      ))}

      <div className="reimbursement">
        <span className="fp-report-expense-dot" />
        <div>
          <strong>Reimbursements</strong>
          <small>Expense recovery / offset</small>
        </div>
        <b>-{money(reimbursementTotal)}</b>
      </div>

      <div className="total">
        <span />
        <div>
          <strong>Total Expenses</strong>
          <small>Net operating cost used for profit</small>
        </div>
        <b>{money(totalExpenses)}</b>
      </div>
    </div>
  </section>

  <section className="fp-panel fp-report-section-panel">
    <div className="fp-section-title fp-report-tight-title">
      <div>
        <h2>Day-by-Day Business Activity</h2>
        <small>
          {dailyRows.length} calendar {dailyRows.length === 1 ? "day" : "days"} ·
          CSV export includes every row below
        </small>
      </div>
    </div>

    <div className="fp-report-daily-note">
      Weekly fixed expenses and weekly odometer fees are booked on the
      first displayed day of each reporting week so the daily rows
      reconcile to the report totals.
    </div>

    <div className="fp-report-table-wrap">
      <table className="fp-compact-table fp-report-daily-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Revenue</th>
            <th>Variable</th>
            <th>Reimb.</th>
            <th>Fixed</th>
            <th>Revenue Fee</th>
            <th>Odometer</th>
            <th>Total Costs</th>
            <th>Net Profit</th>
            <th>Loads</th>
            <th>Miles</th>
          </tr>
        </thead>
        <tbody>
          {dailyRows.map((row) => (
            <tr key={row.date}>
              <td><strong>{row.label}</strong></td>
              <td>{money(row.revenue)}</td>
              <td>{money(row.variable)}</td>
              <td className="good">
                {row.reimbursements > 0
                  ? `-${money(row.reimbursements)}`
                  : money(0)}
              </td>
              <td>{money(row.fixed)}</td>
              <td>{money(row.revenueFee)}</td>
              <td title={`${row.odometerMiles.toLocaleString()} odometer miles`}>
                {money(row.odometerFee)}
              </td>
              <td>{money(row.costs)}</td>
              <td className={row.net >= 0 ? "good" : "bad"}>
                {money(row.net)}
              </td>
              <td>{row.loads}</td>
              <td>{row.miles.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>

  <section className="fp-panel fp-report-section-panel">
    <div className="fp-section-title fp-report-tight-title">
      <div>
        <h2>Truck Performance</h2>
        <small>{reportLabel}</small>
      </div>
    </div>

    <div className="fp-report-table-wrap">
      <table className="fp-compact-table">
        <thead>
          <tr>
            <th>Truck</th>
            <th>Revenue</th>
            <th>Direct Expenses</th>
            <th>Operating Profit*</th>
            <th>Miles</th>
            <th>Completed Loads</th>
          </tr>
        </thead>
        <tbody>
          {truckRows.map((row) => (
            <tr key={row.id}>
              <td>#{row.unit}</td>
              <td>{money(row.revenue)}</td>
              <td>{money(row.expenses)}</td>
              <td className={row.profit >= 0 ? "good" : "bad"}>
                {money(row.profit)}
              </td>
              <td>{row.miles.toLocaleString()}</td>
              <td>{row.completedLoads}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="fp-report-table-note">
      * Truck operating profit shows truck-linked revenue minus
      truck-linked expenses/reimbursements. Company-level fixed expenses
      and revenue fees remain in the business totals above.
    </div>
  </section>
</div>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  note,
  good = false,
}: {
  label: string;
  value: string;
  note: string;
  good?: boolean;
}) {
  return (
    <div className="fp-report-business-metric">
      <span>{label}</span>
      <strong className={good ? "good" : ""}>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function normalizePeriod(value?: string): "week" | "month" | "year" | "custom" {
  return value === "month" || value === "year" || value === "custom"
    ? value
    : "week";
}

function parseDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function standardRange(
  period: "week" | "month" | "year",
  anchor: Date
) {
  if (period === "month") {
    return {
      start: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
      end: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
    };
  }

  if (period === "year") {
    return {
      start: new Date(anchor.getFullYear(), 0, 1),
      end: new Date(anchor.getFullYear(), 11, 31),
    };
  }

  const start = monday(anchor);
  return { start, end: plusDays(start, 6) };
}

function customRange(from?: string, to?: string) {
  const start = parseDate(from) || monday(new Date());
  const end = parseDate(to) || plusDays(start, 6);
  return start <= end ? { start, end } : { start: end, end: start };
}

function inRange(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = parseDate(value.slice(0, 10));
  if (!date) return false;
  return date >= start && date <= end;
}

function countWeeks(start: Date, end: Date) {
  let cursor = monday(start);
  let count = 0;
  while (cursor <= end && count < 60) {
    count += 1;
    cursor = plusDays(cursor, 7);
  }
  return Math.max(count, 1);
}

function calendarDays(start: Date, end: Date) {
  const days: Date[] = [];
  let cursor = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  while (cursor <= end && days.length < 370) {
    days.push(new Date(cursor));
    cursor = plusDays(cursor, 1);
  }

  return days;
}

function periodLabel(
  period: "week" | "month" | "year" | "custom",
  start: Date,
  end: Date
) {
  if (period === "month") {
    return start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  if (period === "year") {
    return String(start.getFullYear());
  }

  const format = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
    });

  return `${format(start)} – ${format(end)}`;
}
