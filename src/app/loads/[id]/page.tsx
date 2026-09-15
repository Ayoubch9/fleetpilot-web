import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import {
  dbDate,
  money,
  num,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";

type Props = {
  params: Promise<{ id: string }>;
};

type Load = {
  id: string;
  truck_id: string | null;
  load_number: string | null;
  broker: string | null;
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
  category: string | null;
  amount: number | string | null;
  vendor: string | null;
  description: string | null;
  expense_date: string | null;
};

export default async function LoadProfitabilityPage({ params }: Props) {
  const { id } = await params;
  const { supabase, fullName, companyName, role } =
    await getFleetPilotAccount();

  const { data: loadData } = await supabase
    .from("loads")
    .select(
      "id, truck_id, load_number, broker, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (!loadData) notFound();

  const load = loadData as Load;
  const weekStart = selectedWeek(load.pickup_date || undefined);
  const weekEndDate = weekEnd(weekStart);
  const weekFrom = dbDate(weekStart);
  const weekTo = dbDate(weekEndDate);

  const [
    directExpenseResult,
    truckResult,
    weeklyLoadsResult,
    weeklyFixedResult,
    feeSettingsResult,
    odometerResult,
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, category, amount, vendor, description, expense_date")
      .eq("load_id", id)
      .order("expense_date"),
    load.truck_id
      ? supabase
          .from("trucks")
          .select("id, unit_number, make, model")
          .eq("id", load.truck_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("loads")
      .select("id, rate, loaded_miles, deadhead_miles")
      .gte("pickup_date", weekFrom)
      .lte("pickup_date", weekTo),
    supabase.from("weekly_fixed_expenses").select("*"),
    supabase.from("company_fee_settings").select("*").limit(1),
    supabase
      .from("weekly_odometer_records")
      .select("start_odometer, end_odometer")
      .eq("week_start", weekFrom),
  ]);

  const directExpenses = (directExpenseResult.data ?? []) as Expense[];
  const truck = truckResult.data as
    | { id: string; unit_number: string; make: string | null; model: string | null }
    | null;
  const weeklyLoads = (weeklyLoadsResult.data ?? []) as Array<{
    id: string;
    rate: number | string | null;
    loaded_miles: number | string | null;
    deadhead_miles: number | string | null;
  }>;

  const revenue = num(load.rate);
  const loadedMiles = num(load.loaded_miles);
  const deadheadMiles = num(load.deadhead_miles);
  const totalMiles = loadedMiles + deadheadMiles;
  const loadedRpm = loadedMiles > 0 ? revenue / loadedMiles : 0;
  const trueRpm = totalMiles > 0 ? revenue / totalMiles : 0;

  const categoryCosts = new Map<string, number>();
  for (const expense of directExpenses) {
    const label = expense.category || "Other";
    categoryCosts.set(label, (categoryCosts.get(label) || 0) + num(expense.amount));
  }

  const directCost = directExpenses.reduce(
    (sum, expense) => sum + num(expense.amount),
    0
  );

  const activeFixed = (weeklyFixedResult.data ?? []).filter((row: any) =>
    typeof row.is_active === "boolean"
      ? row.is_active
      : typeof row.active === "boolean"
        ? row.active
        : true
  );
  const fixedWeekly = activeFixed.reduce(
    (sum: number, row: any) => sum + num(row.amount),
    0
  );

  const settings = (feeSettingsResult.data ?? [])[0] as any;
  const revenueFeePercent =
    settings?.revenue_fee_percent == null
      ? 15
      : num(settings.revenue_fee_percent);
  const revenueFeeActive =
    settings?.is_revenue_fee_active == null
      ? true
      : Boolean(settings.is_revenue_fee_active);
  const mileageFeeRate =
    settings?.mileage_fee_per_mile == null
      ? 0.15
      : num(settings.mileage_fee_per_mile);
  const mileageFeeActive =
    settings?.is_mileage_fee_active == null
      ? true
      : Boolean(settings.is_mileage_fee_active);

  const weeklyLoadMiles = weeklyLoads.reduce(
    (sum, row) =>
      sum + num(row.loaded_miles) + num(row.deadhead_miles),
    0
  );
  const loadShare =
    weeklyLoadMiles > 0
      ? totalMiles / weeklyLoadMiles
      : weeklyLoads.length > 0
        ? 1 / weeklyLoads.length
        : 1;

  const allocatedFixed = fixedWeekly * loadShare;
  const allocatedRevenueFee = revenueFeeActive
    ? revenue * (revenueFeePercent / 100)
    : 0;

  const odometerMiles = (odometerResult.data ?? []).reduce(
    (sum: number, row: any) =>
      sum +
      Math.max(
        num(row.end_odometer) - num(row.start_odometer),
        0
      ),
    0
  );

  const allocatedMileageFee =
    mileageFeeActive && odometerMiles > 0
      ? odometerMiles * mileageFeeRate * loadShare
      : mileageFeeActive
        ? totalMiles * mileageFeeRate
        : 0;

  const allocatedOverhead =
    allocatedFixed + allocatedRevenueFee + allocatedMileageFee;
  const estimatedProfit = revenue - directCost - allocatedOverhead;
  const profitPerMile =
    totalMiles > 0 ? estimatedProfit / totalMiles : 0;
  const margin =
    revenue > 0 ? (estimatedProfit / revenue) * 100 : 0;

  const costRows = [
    ...[...categoryCosts.entries()].map(([label, amount]) => ({
      label,
      amount,
      type: "Direct",
    })),
    {
      label: "Allocated Weekly Fixed Costs",
      amount: allocatedFixed,
      type: "Allocated",
    },
    {
      label: `Company Revenue Fee (${revenueFeePercent.toFixed(1)}%)`,
      amount: allocatedRevenueFee,
      type: "Allocated",
    },
    {
      label: `Mileage Fee (${money(mileageFeeRate)}/mi)`,
      amount: allocatedMileageFee,
      type: "Allocated",
    },
  ].filter((row) => row.amount > 0);

  return (
    <AppShell
      active="loads"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-detail-page">
        <div className="fp-detail-breadcrumb">
          <Link href="/loads">Loads</Link>
          <span>›</span>
          <span>Load #{load.load_number || "—"}</span>
        </div>

        <section className="fp-detail-hero">
          <div>
            <span className="fp-detail-eyebrow">LOAD PROFITABILITY</span>
            <h1>Load #{load.load_number || "—"}</h1>
            <p>
              {load.pickup || "Unknown pickup"} →{" "}
              {load.delivery || "Unknown delivery"}
            </p>
          </div>
          <div className="fp-detail-hero-meta">
            <span>{truck ? `Truck #${truck.unit_number}` : "No truck"}</span>
            <span>{load.broker || "No broker"}</span>
            <span>{load.status || "Upcoming"}</span>
          </div>
        </section>

        <div className="fp-detail-kpi-grid">
          <DetailKpi label="Revenue" value={money(revenue)} tone="blue" />
          <DetailKpi label="Direct Costs" value={money(directCost)} tone="red" />
          <DetailKpi
            label="Allocated Overhead"
            value={money(allocatedOverhead)}
            tone="amber"
          />
          <DetailKpi
            label="Est. Load Profit"
            value={money(estimatedProfit)}
            tone={estimatedProfit >= 0 ? "green" : "red"}
          />
        </div>

        <div className="fp-detail-two-col">
          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div>
                <span>PERFORMANCE</span>
                <h2>Load Economics</h2>
              </div>
            </div>

            <div className="fp-load-economics-grid">
              <Metric label="Loaded Miles" value={`${loadedMiles.toLocaleString()} mi`} />
              <Metric label="Deadhead Miles" value={`${deadheadMiles.toLocaleString()} mi`} />
              <Metric label="Total Miles" value={`${totalMiles.toLocaleString()} mi`} />
              <Metric label="Loaded RPM" value={money(loadedRpm)} />
              <Metric label="True RPM" value={money(trueRpm)} />
              <Metric label="Profit / Mile" value={money(profitPerMile)} />
              <Metric label="Profit Margin" value={`${margin.toFixed(1)}%`} />
              <Metric
                label="Cost / Mile"
                value={money(
                  totalMiles > 0
                    ? (directCost + allocatedOverhead) / totalMiles
                    : 0
                )}
              />
            </div>
          </section>

          <section className="fp-detail-card">
            <div className="fp-detail-card-heading">
              <div>
                <span>COST STRUCTURE</span>
                <h2>Where the Money Went</h2>
              </div>
            </div>
            <div className="fp-profit-cost-list">
              {costRows.length ? (
                costRows.map((row) => (
                  <div key={`${row.type}-${row.label}`}>
                    <span>
                      <b>{row.label}</b>
                      <small>{row.type}</small>
                    </span>
                    <strong>{money(row.amount)}</strong>
                  </div>
                ))
              ) : (
                <p className="fp-detail-muted">No load costs recorded yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="fp-detail-card">
          <div className="fp-detail-card-heading">
            <div>
              <span>TRANSACTIONS</span>
              <h2>Direct Expenses Linked to This Load</h2>
            </div>
          </div>

          <div className="fp-detail-table-wrap">
            <table className="fp-detail-table">
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
                {directExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{displayDate(expense.expense_date)}</td>
                    <td>{expense.category || "Other"}</td>
                    <td>{expense.vendor || "—"}</td>
                    <td>{expense.description || "—"}</td>
                    <td className="fp-detail-money">{money(num(expense.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!directExpenses.length && (
              <div className="fp-detail-empty">
                No direct expenses are linked to this load yet.
              </div>
            )}
          </div>
        </section>

        <div className="fp-detail-note">
          <strong>How estimated profit is calculated</strong>
          <p>
            Revenue minus expenses directly linked to this load, minus this
            load&apos;s proportional share of weekly fixed costs and company
            fees. The allocation is based on the load&apos;s share of weekly
            load miles, so this is an operating estimate rather than an
            accounting ledger entry.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function DetailKpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "red" | "amber" | "green";
}) {
  return (
    <div className={`fp-detail-kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="fp-detail-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function displayDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
}
