import Link from "next/link";
import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import {
  dbDate,
  displayDate,
  graceMonday,
  loadBelongsToWeek,
  money,
  num,
  plusDays,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";

type SearchParams = Promise<{ week?: string }>;

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
};

type Expense = {
  amount: number | string | null;
  category: string | null;
};

type Reimbursement = {
  amount: number | string | null;
};

type FixedExpense = {
  amount: number | string | null;
  is_active?: boolean | null;
  active?: boolean | null;
  name?: string | null;
};

type Odometer = {
  start_odometer: number | string | null;
  end_odometer: number | string | null;
};

type Settings = {
  revenue_fee_percent?: number | string | null;
  mileage_fee_per_mile?: number | string | null;
  is_revenue_fee_active?: boolean | null;
  is_mileage_fee_active?: boolean | null;
};

function isActiveFixed(row: FixedExpense) {
  if (typeof row.is_active === "boolean") return row.is_active;
  if (typeof row.active === "boolean") return row.active;
  return true;
}

export default async function SettlementPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, fullName, companyName, role } = await getFleetPilotAccount();

  const currentStart = selectedWeek(undefined);
  const cookieStore = await cookies();
  const rememberedWeek = cookieStore.get("fleetpilot_week")?.value;
  let start = selectedWeek(params.week || rememberedWeek);
  if (start.getTime() > currentStart.getTime()) start = currentStart;

  const sunday = weekEnd(start);
  const mondayAfter = graceMonday(start);
  const startText = dbDate(start);
  const sundayText = dbDate(sunday);

  const [
    loadsResult,
    expensesResult,
    reimbursementResult,
    fixedResult,
    odometerResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("loads")
      .select("id, load_number, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles")
      .gte("pickup_date", startText)
      .lte("pickup_date", sundayText)
      .order("pickup_date", { ascending: false }),
    supabase
      .from("expenses")
      .select("amount, category")
      .gte("expense_date", startText)
      .lte("expense_date", sundayText),
    supabase
      .from("reimbursements")
      .select("amount")
      .gte("reimbursement_date", startText)
      .lte("reimbursement_date", sundayText),
    supabase.from("weekly_fixed_expenses").select("*"),
    supabase
      .from("weekly_odometer_records")
      .select("start_odometer, end_odometer")
      .eq("week_start", startText),
    supabase.from("company_fee_settings").select("*").limit(1),
  ]);

  const loads = ((loadsResult.data ?? []) as Load[]).filter((load) =>
    loadBelongsToWeek(load.pickup_date, load.delivery_date, start)
  );
  const expenses = (expensesResult.data ?? []) as Expense[];
  const reimbursements = (reimbursementResult.data ?? []) as Reimbursement[];
  const fixed = (fixedResult.data ?? []) as FixedExpense[];
  const odometers = (odometerResult.data ?? []) as Odometer[];
  const settings = ((settingsResult.data ?? []) as Settings[])[0];

  const grossRevenue = loads.reduce((sum, row) => sum + num(row.rate), 0);
  const loadedMiles = loads.reduce((sum, row) => sum + num(row.loaded_miles), 0);
  const deadheadMiles = loads.reduce((sum, row) => sum + num(row.deadhead_miles), 0);
  const totalMiles = loadedMiles + deadheadMiles;

  const variableExpenses = expenses.reduce((sum, row) => sum + num(row.amount), 0);
  const reimbursementTotal = reimbursements.reduce((sum, row) => sum + num(row.amount), 0);
  const netVariableExpenses = variableExpenses - reimbursementTotal;
  const fixedTotal = fixed.filter(isActiveFixed).reduce((sum, row) => sum + num(row.amount), 0);

  const odometerMiles = odometers.reduce(
    (sum, row) => sum + Math.max(num(row.end_odometer) - num(row.start_odometer), 0),
    0
  );

  const revenueFeePercent =
    settings?.revenue_fee_percent == null ? 15 : num(settings.revenue_fee_percent);
  const mileageFeeRate =
    settings?.mileage_fee_per_mile == null ? 0.15 : num(settings.mileage_fee_per_mile);
  const revenueFeeActive =
    settings?.is_revenue_fee_active == null ? true : Boolean(settings.is_revenue_fee_active);
  const mileageFeeActive =
    settings?.is_mileage_fee_active == null ? true : Boolean(settings.is_mileage_fee_active);

  const revenueFee = revenueFeeActive ? grossRevenue * (revenueFeePercent / 100) : 0;
  const mileageFee = mileageFeeActive ? odometerMiles * mileageFeeRate : 0;
  const totalExpenses = netVariableExpenses + fixedTotal + revenueFee + mileageFee;
  const netProfit = grossRevenue - totalExpenses;
  const avgPerMile = totalMiles > 0 ? netProfit / totalMiles : 0;

  const errors = [
    loadsResult.error,
    expensesResult.error,
    reimbursementResult.error,
    fixedResult.error,
    odometerResult.error,
    settingsResult.error,
  ].filter(Boolean);


  const breakdown = [
    { label: "Gross Revenue", value: grossRevenue, kind: "positive" as const },
    { label: "Variable Expenses", value: variableExpenses, kind: "negative" as const },
    { label: "Reimbursements", value: reimbursementTotal, kind: "positive" as const },
    { label: "Fixed Expenses", value: fixedTotal, kind: "negative" as const },
    { label: `Revenue Fee (${revenueFeePercent.toFixed(1)}%)`, value: revenueFee, kind: "negative" as const },
    { label: `Mileage Fee (${money(mileageFeeRate)}/mi)`, value: mileageFee, kind: "negative" as const },
  ];

  return (
    <AppShell active="settlement" fullName={fullName} companyName={companyName} role={role}>
      <div className="fp-settle-page">
        <section className="fp-settle-heading">
          <div>
            <h1 className="fp-settle-title">Weekly Settlement</h1>
            <p className="fp-settle-subtitle">
              Calculate and review your weekly business settlement with every cost accounted for.
            </p>
          </div>

        </section>

        {errors.length > 0 && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            Some settlement sources could not be loaded. Successfully returned data is still shown.
          </div>
        )}

        <div className="fp-settle-layout mt-4">
          <div className="min-w-0">
            <div className="fp-settle-kpi-grid">
              <SettleKpi label="Gross Revenue" value={money(grossRevenue)} tone="blue" icon="revenue" note={`${loads.length} loads this week`} />
              <SettleKpi label="Total Miles" value={`${totalMiles.toLocaleString()} mi`} tone="green" icon="miles" note={`${odometerMiles.toLocaleString()} odometer mi`} />
              <SettleKpi label="Net Profit" value={money(netProfit)} tone={netProfit >= 0 ? "purple" : "red"} icon="profit" note={`${money(avgPerMile)} profit / mile`} />
            </div>

            <section className="fp-settle-table-card mt-4">
              <div className="fp-settle-tabs">
                <span className="fp-settle-tab active">Settlement Loads <b>{loads.length}</b></span>
                <span className="fp-settle-tab">Costs <b>{expenses.length}</b></span>
                <span className="fp-settle-tab">Reimbursements <b>{reimbursements.length}</b></span>
              </div>

              <div className="fp-settle-filterbar">
                <div className="fp-settle-search"><SearchIcon /><span>Search by load, route, week...</span></div>
                <button><CalendarIcon /> Week Range</button>
                <button>Status <span>⌄</span></button>
                <button><FilterIcon /> More Filters</button>
                <div className="fp-settle-sort"><span>Sort by</span><button>Week (Newest)⌄</button></div>
              </div>

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
                    {loads.map((load, index) => {
                      const miles = num(load.loaded_miles) + num(load.deadhead_miles);
                      const revenue = num(load.rate);
                      const proportionalCost = grossRevenue > 0 ? totalExpenses * (revenue / grossRevenue) : 0;
                      const profit = revenue - proportionalCost;
                      return (
                        <tr key={load.id}>
                          <td className="fp-settle-number">#{load.load_number || String(index + 1).padStart(4, "0")}</td>
                          <td className="fp-settle-route">{compact(load.pickup)} → {compact(load.delivery)}</td>
                          <td>{shortDate(load.pickup_date)}</td>
                          <td>{miles.toLocaleString()} mi</td>
                          <td className="fp-settle-money">{money(revenue)}</td>
                          <td className={profit >= 0 ? "fp-settle-profit" : "fp-settle-loss"}>{money(profit)}</td>
                          <td><StatusBadge tone="green">Included</StatusBadge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {loads.length === 0 && <EmptyState text="No loads in this settlement week." />}
              </div>

              <div className="fp-settle-footer">
                <span>
                  Pickup {displayDate(start)}–{displayDate(sunday)} · delivery allowed through {displayDate(mondayAfter)}
                </span>
                <span className="fp-settle-page-size">10 per page⌄</span>
              </div>
            </section>
          </div>

          <aside className="fp-settle-right-rail">
            <section className="fp-settle-side-card">
              <h2>Quick Actions</h2>
              <div className="mt-3 grid gap-2">
                <Link href="/settlement" className="fp-settle-side-action primary">
                  <span className="fp-settle-side-icon"><CalculatorIcon /></span>
                  <span>Current Settlement</span><span>›</span>
                </Link>
                <Link href="/expenses" className="fp-settle-side-action">
                  <span className="fp-settle-side-icon"><ImportIcon /></span>
                  <span>Review Expenses</span><span>›</span>
                </Link>
                <Link href="/reports" className="fp-settle-side-action">
                  <span className="fp-settle-side-icon"><ExportIcon /></span>
                  <span>Export Settlement</span><span>›</span>
                </Link>
                <Link href="/reimbursements" className="fp-settle-side-action">
                  <span className="fp-settle-side-icon"><WalletIcon /></span>
                  <span>Reimbursements</span><span>›</span>
                </Link>
              </div>
            </section>

            <section className="fp-settle-side-card">
              <h2>Settlement Overview</h2>
              <div className="fp-settle-overview-legend mt-3">
                <span><i className="gross" />Gross Revenue</span>
                <span><i className="net" />Net Profit</span>
              </div>
              <SettleMiniChart revenue={grossRevenue} profit={Math.max(netProfit, 0)} />
            </section>

            <section className="fp-settle-side-card">
              <div className="flex items-center justify-between">
                <h2>Cost Breakdown</h2>
                <span className="text-[9px] font-[600] text-[#1188ff]">View All →</span>
              </div>
              <div className="fp-settle-cost-list mt-3">
                {breakdown.map((item, index) => (
                  <div key={item.label} className="fp-settle-cost-row">
                    <span className="fp-settle-rank">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <strong className={item.kind === "positive" ? "positive" : ""}>{money(item.value)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <div className="fp-settle-promo">
              <div className="absolute inset-0 bg-gradient-to-r from-[#06182d]/82 via-[#06182d]/26 to-transparent" />
              <div className="relative z-10">
                <div className="text-[16px] font-[740] leading-[1.18] text-white">Your Miles.<br />Your Profit.</div>
                <div className="mt-4 h-[3px] w-10 bg-[#4c98ff]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function SettleKpi({ label, value, tone, icon, note }: {
  label: string;
  value: string;
  tone: "blue" | "green" | "purple" | "red";
  icon: "revenue" | "miles" | "profit";
  note: string;
}) {
  const palette = {
    blue: { color: "#4b8df6", soft: "#eaf3ff" },
    green: { color: "#55a965", soft: "#e9f7ed" },
    purple: { color: "#765ce7", soft: "#f0edff" },
    red: { color: "#e75b63", soft: "#fff0f1" },
  }[tone];
  return (
    <div className="fp-settle-kpi">
      <div className="fp-settle-kpi-icon" style={{ color: palette.color, backgroundColor: palette.soft }}>
        {icon === "revenue" ? <WalletIcon /> : icon === "miles" ? <MileageIcon /> : <ProfitIcon />}
      </div>
      <div>
        <div className="fp-settle-kpi-label">{label}</div>
        <div className="fp-number fp-settle-kpi-value">{value}</div>
        <div className="fp-settle-kpi-note">{note}</div>
      </div>
    </div>
  );
}

function SettleMiniChart({ revenue, profit }: { revenue: number; profit: number }) {
  const max = Math.max(revenue, profit, 1);
  const months = [0.62, 0.78, 0.69, 0.86];
  return (
    <div className="fp-settle-mini-chart">
      {months.map((factor, index) => (
        <div key={index} className="fp-settle-mini-group">
          <div className="fp-settle-mini-bars">
            <span className="gross" style={{ height: `${Math.max(20, factor * 92)}px` }} />
            <span className="net" style={{ height: `${Math.max(12, factor * (profit / max) * 92)}px` }} />
          </div>
          <small>{["Jun", "Jul", "Aug", "Sep"][index]}</small>
        </div>
      ))}
    </div>
  );
}

function compact(value?: string | null) {
  if (!value) return "—";
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.slice(0, 2).join(", ");
}
function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function SearchIcon(){return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>}
function CalendarIcon(){return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg>}
function FilterIcon(){return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>}
function WalletIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16v12H4z"/><path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z"/></svg>}
function MileageIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 12l4-3M7 16h10"/></svg>}
function ProfitIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M5 18V11M10 18V7M15 18V13M20 18V4"/></svg>}
function CalculatorIcon(){return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2"/></svg>}
function ImportIcon(){return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M5 19h14V9H5z"/><path d="M12 3v10M8 7l4-4 4 4"/></svg>}
function ExportIcon(){return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M5 5h14v14H5z"/><path d="M12 15V5M8 9l4-4 4 4"/></svg>}
