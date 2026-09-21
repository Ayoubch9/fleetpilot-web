import { calculateWeekFinance } from "@/lib/week-finance";
import { CHART_PALETTE } from "@/lib/chart-palette";
import KpiTile from "@/components/kpi-tile";
import { formatPercent } from "@/lib/format";
import Link from "next/link";
import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import PromoBanner from "@/components/promo-banner";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import SettlementControls, {
  type SettlementTab,
} from "./settlement-controls";
import SettlementQuickActions from "./settlement-quick-actions";
import {
  dbDate,
  displayDate,
  graceMonday,
  loadBelongsToWeek,
  money,
  num,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";

type SearchParams = Promise<{
  week?: string;
  tab?: string;
  q?: string;
  status?: string;
  sort?: string;
  minAmount?: string;
  maxAmount?: string;
}>;

type Load = {
  id: string;
  load_number: string | null;
  pickup: string | null;
  delivery: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  rate: number | string | null;
  loaded_miles: number | string | null;
  deadhead_miles: number | string | null;
  status: string | null;
};

type Expense = {
  id: string;
  amount: number | string | null;
  category: string | null;
  expense_date: string | null;
  vendor: string | null;
  description: string | null;
  truck_id: string | null;
};

type Reimbursement = {
  id: string;
  expense_id: string | null;
  truck_id: string | null;
  category: string | null;
  reference: string | null;
  reimbursement_date: string | null;
  amount: number | string | null;
  notes: string | null;
};

type FixedExpense = {
  amount: number | string | null;
  is_active?: boolean | null;
  active?: boolean | null;
  name?: string | null;
};

type CostRow = {
  id: string;
  amount: number | string | null;
  category: string | null;
  expense_date: string | null;
  vendor: string | null;
  description: string | null;
};

type Odometer = {
  start_odometer: number | string | null;
  end_odometer: number | string | null;
};

type SecurityDepositTransaction = {
  transaction_type: "HOLD" | "RETURN" | "ADJUSTMENT";
  adjustment_direction: "INCREASE" | "DECREASE" | null;
  amount: number | string | null;
  transaction_date: string | null;
};

type Settings = {
  revenue_fee_percent?: number | string | null;
  mileage_fee_per_mile?: number | string | null;
  is_revenue_fee_active?: boolean | null;
  is_mileage_fee_active?: boolean | null;
};


export default async function SettlementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const currentStart = selectedWeek(undefined);
  const cookieStore = await cookies();
  const rememberedWeek = cookieStore.get("fleetpilot_week")?.value;

  let start = selectedWeek(params.week || rememberedWeek);
  if (start.getTime() > currentStart.getTime()) start = currentStart;

  const sunday = weekEnd(start);
  const mondayAfter = graceMonday(start);
  const startText = dbDate(start);
  const sundayText = dbDate(sunday);

  const tab: SettlementTab =
    params.tab === "costs"
      ? "costs"
      : params.tab === "reimbursements"
        ? "reimbursements"
        : "loads";

  const q = (params.q || "").trim().toLowerCase();
  const statusFilter = (params.status || "all").toLowerCase();
  const sort = params.sort || "newest";
  const minAmount =
    params.minAmount && Number.isFinite(Number(params.minAmount))
      ? Number(params.minAmount)
      : null;
  const maxAmount =
    params.maxAmount && Number.isFinite(Number(params.maxAmount))
      ? Number(params.maxAmount)
      : null;

  const [
    loadsResult,
    expensesResult,
    reimbursementResult,
    fixedResult,
    odometerResult,
    settingsResult,
    weeklyDepositResult,
    depositBalanceResult,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select(
        "id, load_number, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"
      )
      .gte("pickup_date", startText)
      .lte("pickup_date", sundayText)
      .order("pickup_date", { ascending: false }),
    supabase
      .from("expenses")
      .select(
        "id, amount, category, expense_date, vendor, description, truck_id"
      )
      .gte("expense_date", startText)
      .lte("expense_date", sundayText),
    supabase
      .from("reimbursements")
      .select(
        "id, expense_id, truck_id, category, reference, reimbursement_date, amount, notes"
      )
      .gte("reimbursement_date", startText)
      .lte("reimbursement_date", sundayText),
    supabase.from("weekly_fixed_expenses").select("*"),
    supabase
      .from("weekly_odometer_records")
      .select("start_odometer, end_odometer")
      .eq("week_start", startText),
    supabase.from("company_fee_settings").select("*").limit(1),
    supabase
      .from("security_deposit_transactions")
      .select("transaction_type, adjustment_direction, amount, transaction_date")
      .gte("transaction_date", startText)
      .lte("transaction_date", sundayText),
    supabase
      .from("security_deposit_transactions")
      .select("transaction_type, adjustment_direction, amount"),
  ]);

  const loads = ((loadsResult.data ?? []) as Load[]).filter((load) =>
    loadBelongsToWeek(load.pickup_date, load.delivery_date, start)
  );
  const expenses = (expensesResult.data ?? []) as Expense[];
  const reimbursements =
    (reimbursementResult.data ?? []) as Reimbursement[];
  const fixed = (fixedResult.data ?? []) as FixedExpense[];
  const activeFixed = fixed.filter((row) =>
    typeof row.is_active === "boolean"
      ? row.is_active
      : typeof row.active === "boolean"
        ? row.active
        : true
  );
  const fixedCostRows: CostRow[] = activeFixed.map((row, index) => ({
    id: `fixed-${index}-${row.name || "expense"}`,
    amount: row.amount,
    category: "Fixed Expense",
    expense_date: startText,
    vendor: null,
    description: row.name || "Weekly fixed expense",
  }));
  const odometers = (odometerResult.data ?? []) as Odometer[];
  const settings = ((settingsResult.data ?? []) as Settings[])[0];
  const weeklyDepositTransactions =
    (weeklyDepositResult.data ?? []) as SecurityDepositTransaction[];
  const allDepositTransactions =
    (depositBalanceResult.data ?? []) as SecurityDepositTransaction[];

  const depositEffect = (row: SecurityDepositTransaction) => {
    const amount = num(row.amount);
    if (row.transaction_type === "HOLD") return amount;
    if (row.transaction_type === "RETURN") return -amount;
    return row.adjustment_direction === "DECREASE"
      ? -amount
      : amount;
  };

  const weeklyDepositHeld = weeklyDepositTransactions
    .map(depositEffect)
    .filter((value) => value > 0)
    .reduce((sum, value) => sum + value, 0);
  const weeklyDepositReturned = weeklyDepositTransactions
    .map(depositEffect)
    .filter((value) => value < 0)
    .reduce((sum, value) => sum + Math.abs(value), 0);
  const depositOutstanding = Math.max(
    allDepositTransactions.reduce(
      (sum, row) => sum + depositEffect(row),
      0
    ),
    0
  );

  const finance = calculateWeekFinance({
    loads,
    expenses,
    reimbursements,
    fixedExpenses: fixed,
    odometers,
    settings,
  });

  const {
    grossRevenue,
    loadedMiles,
    deadheadMiles,
    totalMiles,
    variableExpenses,
    reimbursementTotal,
    netVariableExpenses,
    fixedTotal,
    fuelCost,
    odometerMiles,
    revenueFeePercent,
    mileageFeeRate,
    revenueFee,
    mileageFee,
    totalExpenses,
    netProfit,
    revenuePerMile,
    costPerMile,
    profitPerMile,
    profitMargin,
    deadheadPercent,
  } = finance;

  const cashReceivedAfterHoldback =
    netProfit - weeklyDepositHeld + weeklyDepositReturned;
  const cashIsDue = cashReceivedAfterHoldback < 0;
  const cashDisplayAmount = Math.abs(cashReceivedAfterHoldback);
  const cashDisplayLabel = cashIsDue
    ? "Est. Cash Due"
    : "Est. Cash Paid This Week";

  const errors = [
    loadsResult.error,
    expensesResult.error,
    reimbursementResult.error,
    fixedResult.error,
    odometerResult.error,
    settingsResult.error,
    weeklyDepositResult.error,
    depositBalanceResult.error,
  ].filter(Boolean);

  const loadStatuses = [
    ...new Set(
      loads
        .map((row) => normalizeStatus(row.status))
        .filter(Boolean)
    ),
  ].sort();

  const allCostRows: CostRow[] = [
    ...expenses,
    ...fixedCostRows,
  ];

  const costCategories = [
    ...new Set(
      allCostRows
        .map((row) => (row.category || "Other").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  let filteredLoads = loads.filter((row) => {
    if (!q) return true;
    return [
      row.load_number,
      row.pickup,
      row.delivery,
      row.pickup_date,
      row.delivery_date,
      row.status,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (statusFilter !== "all") {
    filteredLoads = filteredLoads.filter(
      (row) =>
        normalizeStatus(row.status).toLowerCase() === statusFilter
    );
  }

  if (minAmount != null) {
    filteredLoads = filteredLoads.filter(
      (row) => num(row.rate) >= minAmount
    );
  }

  if (maxAmount != null) {
    filteredLoads = filteredLoads.filter(
      (row) => num(row.rate) <= maxAmount
    );
  }

  filteredLoads = [...filteredLoads].sort((a, b) => {
    if (sort === "oldest") {
      return dateValue(a.pickup_date) - dateValue(b.pickup_date);
    }
    if (sort === "amount-desc") {
      return num(b.rate) - num(a.rate);
    }
    if (sort === "amount-asc") {
      return num(a.rate) - num(b.rate);
    }
    return dateValue(b.pickup_date) - dateValue(a.pickup_date);
  });

  let filteredCosts = allCostRows.filter((row) => {
    if (!q) return true;
    return [
      row.category,
      row.vendor,
      row.description,
      row.expense_date,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (statusFilter !== "all") {
    filteredCosts = filteredCosts.filter(
      (row) =>
        (row.category || "Other").toLowerCase() === statusFilter
    );
  }

  if (minAmount != null) {
    filteredCosts = filteredCosts.filter(
      (row) => num(row.amount) >= minAmount
    );
  }

  if (maxAmount != null) {
    filteredCosts = filteredCosts.filter(
      (row) => num(row.amount) <= maxAmount
    );
  }

  filteredCosts = [...filteredCosts].sort((a, b) => {
    if (sort === "oldest") {
      return dateValue(a.expense_date) - dateValue(b.expense_date);
    }
    if (sort === "amount-desc") {
      return num(b.amount) - num(a.amount);
    }
    if (sort === "amount-asc") {
      return num(a.amount) - num(b.amount);
    }
    return dateValue(b.expense_date) - dateValue(a.expense_date);
  });

  let filteredReimbursements = reimbursements.filter((row) => {
    if (!q) return true;
    return [
      row.reference,
      row.notes,
      row.category,
      row.reimbursement_date,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (statusFilter === "linked") {
    filteredReimbursements = filteredReimbursements.filter(
      (row) => Boolean(row.expense_id)
    );
  }

  if (statusFilter === "standalone") {
    filteredReimbursements = filteredReimbursements.filter(
      (row) => !row.expense_id
    );
  }

  if (minAmount != null) {
    filteredReimbursements = filteredReimbursements.filter(
      (row) => num(row.amount) >= minAmount
    );
  }

  if (maxAmount != null) {
    filteredReimbursements = filteredReimbursements.filter(
      (row) => num(row.amount) <= maxAmount
    );
  }

  filteredReimbursements = [...filteredReimbursements].sort(
    (a, b) => {
      if (sort === "oldest") {
        return (
          dateValue(a.reimbursement_date) -
          dateValue(b.reimbursement_date)
        );
      }
      if (sort === "amount-desc") {
        return num(b.amount) - num(a.amount);
      }
      if (sort === "amount-asc") {
        return num(a.amount) - num(b.amount);
      }
      return (
        dateValue(b.reimbursement_date) -
        dateValue(a.reimbursement_date)
      );
    }
  );

  const breakdown = [
    {
      label: "Gross Revenue",
      value: grossRevenue,
      kind: "positive" as const,
    },
    {
      label: "Variable Expenses",
      value: variableExpenses,
      kind: "negative" as const,
    },
    {
      label: "Reimbursements",
      value: reimbursementTotal,
      kind: "positive" as const,
    },
    {
      label: "Fixed Expenses",
      value: fixedTotal,
      kind: "negative" as const,
    },
    {
      label: `Revenue Fee (${formatPercent(revenueFeePercent)})`,
      value: revenueFee,
      kind: "negative" as const,
    },
    {
      label: `Mileage Fee (${money(mileageFeeRate)}/mi)`,
      value: mileageFee,
      kind: "negative" as const,
    },
  ];

  return (
    <AppShell
      active="settlement"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-settle-page">
        <section className="fp-settle-heading">
          <div>
            <h1 className="fp-settle-title">Weekly Settlement</h1>
            <p className="fp-settle-subtitle">
              Calculate and review your weekly business settlement with every
              cost accounted for.
            </p>
          </div>
        </section>

        {errors.length > 0 && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            Some settlement sources could not be loaded. Successfully returned
            data is still shown.
          </div>
        )}

        <div className="fp-settle-layout mt-4">
          <div className="min-w-0">
            <div className="fp-settle-kpi-grid">
              <KpiTile
              label="Gross Revenue"
                              value={money(grossRevenue)}
                              note={`${loads.length} loads this week`}
            />
              <KpiTile
              label="Total Miles"
                              value={`${totalMiles.toLocaleString()} mi`}
                              note={`${odometerMiles.toLocaleString()} odometer mi`}
            />
              <KpiTile
              label="Net Profit"
                              value={money(netProfit)}
                              note={totalMiles > 0 ? `${money(profitPerMile)} profit / mile` : "n/a profit / mile"}
            />
            </div>

            <section className="fp-settle-table-card mt-4">
              <SettlementControls
                tab={tab}
                loadCount={loads.length}
                costCount={allCostRows.length}
                reimbursementCount={reimbursements.length}
                selectedWeek={startText}
                loadStatuses={loadStatuses}
                costCategories={costCategories}
              />

              {tab === "loads" && (
                <LoadsTable
                  rows={filteredLoads}
                  grossRevenue={grossRevenue}
                  totalExpenses={totalExpenses}
                />
              )}

              {tab === "costs" && (
                <CostsTable rows={filteredCosts} />
              )}

              {tab === "reimbursements" && (
                <ReimbursementsTable rows={filteredReimbursements} />
              )}

              <div className="fp-settle-footer">
                <span>
                  Pickup {displayDate(start)}–{displayDate(sunday)} · delivery
                  allowed through {displayDate(mondayAfter)}
                </span>
                <span className="fp-settle-page-size">
                  {tab === "loads"
                    ? filteredLoads.length
                    : tab === "costs"
                      ? filteredCosts.length
                      : filteredReimbursements.length}{" "}
                  shown
                </span>
              </div>
            </section>

            <section className="fp-settle-weekly-overview mt-4">
              <div className="fp-settle-weekly-overview-heading">
                <div>
                  <span>WEEKLY OVERVIEW</span>
                  <h2>
                    {displayDate(start)} – {displayDate(sunday)}
                  </h2>
                  <p>
                    The operating numbers behind this week’s settlement.
                  </p>
                </div>
                <div className="fp-settle-margin-pill">
                  <span>Profit Margin</span>
                  <strong>{profitMargin == null ? "n/a" : formatPercent(profitMargin)}</strong>
                </div>
              </div>

              <div className="fp-settle-overview-grid">
                <KpiTile
                  label="Revenue / Mile"
                                    value={totalMiles > 0 ? money(revenuePerMile) : "n/a"}
                                    note="Gross revenue ÷ total load miles"
                />
                <KpiTile
                  label="Cost / Mile"
                                    value={totalMiles > 0 ? money(costPerMile) : "n/a"}
                                    note="All weekly operating costs"
                />
                <KpiTile
                  label="Profit / Mile"
                                    value={totalMiles > 0 ? money(profitPerMile) : "n/a"}
                                    note="Net profit ÷ total load miles"
                />
                <KpiTile
                  label="Deadhead"
                                    value={formatPercent(deadheadPercent)}
                                    note={`${deadheadMiles.toLocaleString()} deadhead miles`}
                />
                <KpiTile
                  label="Fuel Cost"
                                    value={money(fuelCost)}
                                    note={`${formatPercent(variableExpenses > 0 ? (fuelCost / variableExpenses) * 100 : 0)} of variable costs`}
                />
                <KpiTile
                  label="Reimbursements"
                                    value={money(reimbursementTotal)}
                                    note={`${reimbursements.length} recovered transactions`}
                />
                <KpiTile
                  label="Fixed + Company Fees"
                                    value={money(fixedTotal + revenueFee + mileageFee)}
                                    note={`${money(fixedTotal)} fixed · ${money(revenueFee + mileageFee)} fees`}
                />
                <KpiTile
                  label="Odometer Miles"
                                    value={`${odometerMiles.toLocaleString()} mi`}
                                    note={`${money(mileageFeeRate)} company mileage rate`}
                />
                <KpiTile
                  label="Security Holdback"
                                    value={money(weeklyDepositHeld)}
                                    note={`${money(depositOutstanding)} still owed by company`}
                />
              </div>

              <div className="fp-settle-flow">
                <FlowStep
                  label="Gross Revenue"
                  value={money(grossRevenue)}
                  tone="blue"
                />
                <span className="fp-settle-flow-arrow">→</span>
                <FlowStep
                  label="Operating Costs"
                  value={money(totalExpenses)}
                  tone="red"
                />
                <span className="fp-settle-flow-arrow">→</span>
                <FlowStep
                  label="Net Profit"
                  value={money(netProfit)}
                  tone={netProfit >= 0 ? "green" : "red"}
                />
              </div>
            </section>
          </div>

          <aside className="fp-settle-right-rail">
            <section className="fp-settle-side-card">
              <h2>Quick Actions</h2>
              <SettlementQuickActions
                summary={{
                  companyName,
                  weekLabel: `${displayDate(start)} – ${displayDate(sunday)}`,
                  weekStart: startText,
                  grossRevenue,
                  totalMiles,
                  variableExpenses,
                  reimbursements: reimbursementTotal,
                  fixedExpenses: fixedTotal,
                  revenueFee,
                  mileageFee,
                  totalExpenses,
                  netProfit,
                  revenuePerMile,
                  costPerMile,
                  profitPerMile,
                  profitMargin,
                  deadheadPercent,
                  fuelCost,
                }}
                loads={loads.map((load, index) => ({
                  loadNumber:
                    load.load_number ||
                    String(index + 1).padStart(4, "0"),
                  route: `${compact(load.pickup)} → ${compact(load.delivery)}`,
                  pickupDate: shortDate(load.pickup_date),
                  miles:
                    num(load.loaded_miles) + num(load.deadhead_miles),
                  revenue: num(load.rate),
                }))}
                costs={allCostRows.map((row) => ({
                  date: shortDate(row.expense_date),
                  category: row.category || "Other",
                  vendor: row.vendor || "",
                  description: row.description || "Business expense",
                  amount: num(row.amount),
                }))}
                reimbursements={reimbursements.map((row) => ({
                  date: shortDate(row.reimbursement_date),
                  type: row.expense_id ? "Linked" : "Standalone",
                  category: row.category || "Other",
                  reference:
                    row.reference || row.notes || "Reimbursement",
                  amount: num(row.amount),
                }))}
              />
            </section>

            <section className="fp-settle-side-card fp-settle-deposit-card">
              <div className="flex items-center justify-between">
                <h2>Security Deposit</h2>
                <Link
                  href="/security-deposit"
                  className="text-[9px] font-[600] text-[#16853B]"
                >
                  View Ledger →
                </Link>
              </div>

              <div className="fp-settle-deposit-summary mt-3">
                <div>
                  <span>Held This Week</span>
                  <strong>{money(weeklyDepositHeld)}</strong>
                </div>
                <div>
                  <span>Returned This Week</span>
                  <strong className="positive">
                    {money(weeklyDepositReturned)}
                  </strong>
                </div>
                <div>
                  <span>Still Owed to You</span>
                  <strong>{money(depositOutstanding)}</strong>
                </div>
                <div className="cash">
                  <span>{cashDisplayLabel}</span>
                  <strong className={cashIsDue ? "negative" : "positive"}>
                    {money(cashDisplayAmount)}
                  </strong>
                </div>
              </div>

              <p className="fp-settle-deposit-note">
                Holdbacks affect cash received, not operating profit.
              </p>
            </section>

            <section className="fp-settle-side-card">
              <h2>Settlement Overview</h2>
              <div className="fp-settle-overview-legend mt-3">
                <span>
                  <i className="gross" />
                  Gross Revenue
                </span>
                <span>
                  <i className="net" />
                  Net Profit
                </span>
              </div>
              <SettleMiniChart
                revenue={grossRevenue}
                profit={Math.max(netProfit, 0)}
              />
            </section>

            <section className="fp-settle-side-card">
              <div className="flex items-center justify-between">
                <h2>Cost Breakdown</h2>
                <Link
                  href={`/settlement?week=${startText}&tab=costs`}
                  className="text-[9px] font-[600] text-[#16853B]"
                >
                  View All →
                </Link>
              </div>
              <div className="fp-settle-cost-list mt-3">
                {breakdown.map((item, index) => (
                  <div key={item.label} className="fp-settle-cost-row">
                    <span className="fp-settle-rank">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    <strong
                      className={
                        item.kind === "positive" ? "positive" : ""
                      }
                    >
                      {money(item.value)}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <PromoBanner
              headline="Your miles. Your profit."
              subtext="Use the weekly settlement to see what remains after the costs that run the operation."
              cta={{ label: "Open reports", href: "/reports" }}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function LoadsTable({
  rows,
  grossRevenue,
  totalExpenses,
}: {
  rows: Load[];
  grossRevenue: number;
  totalExpenses: number;
}) {
  return (
    <div className="fp-settle-table-wrap">
      <table className="fp-settle-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Route</th>
            <th>Pickup</th>
            <th>Total Miles</th>
            <th>Gross Revenue</th>
            <th>Est. Profit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((load, index) => {
            const miles =
              num(load.loaded_miles) + num(load.deadhead_miles);
            const revenue = num(load.rate);
            const proportionalCost =
              grossRevenue > 0
                ? totalExpenses * (revenue / grossRevenue)
                : 0;
            const profit = revenue - proportionalCost;

            return (
              <tr key={load.id}>
                <td className="fp-settle-number">
                  #
                  {load.load_number ||
                    String(index + 1).padStart(4, "0")}
                </td>
                <td className="fp-settle-route">
                  {compact(load.pickup)} → {compact(load.delivery)}
                </td>
                <td>{shortDate(load.pickup_date)}</td>
                <td>{miles.toLocaleString()} mi</td>
                <td className="fp-settle-money">
                  {money(revenue)}
                </td>
                <td
                  className={
                    profit >= 0
                      ? "fp-settle-profit"
                      : "fp-settle-loss"
                  }
                >
                  {money(profit)}
                </td>
                <td>
                  <StatusBadge
                    tone={
                      normalizeStatus(load.status) === "Cancelled"
                        ? "red"
                        : normalizeStatus(load.status) === "Completed"
                          ? "green"
                          : "blue"
                    }
                  >
                    {normalizeStatus(load.status)}
                  </StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <EmptyState text="No settlement loads match these filters." />
      )}
    </div>
  );
}

function CostsTable({ rows }: { rows: CostRow[] }) {
  return (
    <div className="fp-settle-table-wrap">
      <table className="fp-settle-table fp-settle-cost-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{shortDate(row.expense_date)}</td>
              <td>
                <StatusBadge tone="blue">
                  {row.category || "Other"}
                </StatusBadge>
              </td>
              <td>{row.vendor || "—"}</td>
              <td className="fp-settle-route">
                {row.description || "Business expense"}
              </td>
              <td className="fp-settle-loss">
                {money(num(row.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <EmptyState text="No weekly costs match these filters." />
      )}
    </div>
  );
}

function ReimbursementsTable({
  rows,
}: {
  rows: Reimbursement[];
}) {
  return (
    <div className="fp-settle-table-wrap">
      <table className="fp-settle-table fp-settle-reimb-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Reference / Notes</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{shortDate(row.reimbursement_date)}</td>
              <td>
                <StatusBadge tone={row.expense_id ? "green" : "blue"}>
                  {row.expense_id ? "Linked" : "Standalone"}
                </StatusBadge>
              </td>
              <td>{row.category || "Other"}</td>
              <td className="fp-settle-route">
                {row.reference || row.notes || "Reimbursement"}
              </td>
              <td className="fp-settle-profit">
                {money(num(row.amount))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <EmptyState text="No reimbursements match these filters." />
      )}
    </div>
  );
}



function FlowStep({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "red";
}) {
  return (
    <div className={`fp-settle-flow-step ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SettleMiniChart({
  revenue,
  profit,
}: {
  revenue: number;
  profit: number;
}) {
  const max = Math.max(revenue, profit, 1);
  const months = [0.62, 0.78, 0.69, 0.86];

  return (
    <div className="fp-settle-mini-chart">
      {months.map((factor, index) => (
        <div key={index} className="fp-settle-mini-group">
          <div className="fp-settle-mini-bars">
            <span
              className="gross"
              style={{
                height: `${Math.max(20, factor * 92)}px`,
                backgroundColor: CHART_PALETTE.navy,
              }}
            />
            <span
              className="net"
              style={{
                height: `${Math.max(
                  12,
                  factor * (profit / max) * 92
                )}px`,
                backgroundColor: CHART_PALETTE.green,
              }}
            />
          </div>
          <small>{["Jun", "Jul", "Aug", "Sep"][index]}</small>
        </div>
      ))}
    </div>
  );
}

function normalizeStatus(value?: string | null) {
  const status = (value || "Upcoming").trim();
  if (!status) return "Upcoming";
  return status
    .toLowerCase()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

function compact(value?: string | null) {
  if (!value) return "—";
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, 2).join(", ");
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(
    `${value.slice(0, 10)}T12:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(`${value.slice(0, 10)}T12:00:00`);
  return Number.isFinite(parsed) ? parsed : 0;
}




function CalculatorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[14px] w-[14px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M5 19h14V9H5z" />
      <path d="M12 3v10M8 7l4-4 4 4" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M5 5h14v14H5z" />
      <path d="M12 15V5M8 9l4-4 4 4" />
    </svg>
  );
}
