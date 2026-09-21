import { formatPercent } from "@/lib/format";
import { calculateLoadProfitabilityMap } from "@/lib/load-domain";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
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
  load_id: string | null;
  category: string | null;
  amount: number | string | null;
  vendor: string | null;
  description: string | null;
  expense_date: string | null;
};

export default async function LoadProfitabilityPage({ params }: Props) {
  const { id } = await params;
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

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
    weeklyExpenseResult,
    truckResult,
    weeklyLoadsResult,
    weeklyFixedResult,
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, load_id, category, amount, vendor, description, expense_date")
      .gte("expense_date", weekFrom)
      .lte("expense_date", weekTo)
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
      .select("id, rate, loaded_miles, deadhead_miles, pickup_date")
      .gte("pickup_date", weekFrom)
      .lte("pickup_date", weekTo),
    supabase.from("weekly_fixed_expenses").select("*"),
  ]);

  const weeklyExpenses = (weeklyExpenseResult.data ?? []) as Expense[];
  const directExpenses = weeklyExpenses.filter((expense) => expense.load_id === id);
  const truck = truckResult.data as
    | { id: string; unit_number: string; make: string | null; model: string | null }
    | null;
  const weeklyLoads = (weeklyLoadsResult.data ?? []) as Array<{
    id: string;
    rate: number | string | null;
    loaded_miles: number | string | null;
    deadhead_miles: number | string | null;
    pickup_date: string | null;
  }>;

  const revenue = num(load.rate);
  const loadedMiles = num(load.loaded_miles);
  const deadheadMiles = num(load.deadhead_miles);
  const totalMiles = loadedMiles + deadheadMiles;
  const loadedRpm = loadedMiles > 0 ? revenue / loadedMiles : 0;
  const trueRpm = totalMiles > 0 ? revenue / totalMiles : 0;

  const profitability = calculateLoadProfitabilityMap({
    loads: weeklyLoads,
    expenses: weeklyExpenses,
    fixedExpenses: weeklyFixedResult.data ?? [],
    expenseSourceAvailable: !weeklyExpenseResult.error,
    fixedExpenseSourceAvailable: !weeklyFixedResult.error,
  });
  const profitResult = profitability.get(load.id);

  const directFuelAndTolls = profitResult?.directFuelAndTolls ?? 0;
  const allocatedSharedFuelAndTolls =
    profitResult?.allocatedSharedFuelAndTolls ?? 0;
  const allocatedFixed = profitResult?.allocatedFixed ?? 0;
  const allocatedCost = profitResult?.allocatedCost ?? null;
  const estimatedProfit = profitResult?.profit ?? null;
  const profitPerMile =
    estimatedProfit != null && totalMiles > 0
      ? estimatedProfit / totalMiles
      : null;
  const margin =
    estimatedProfit != null && revenue > 0
      ? (estimatedProfit / revenue) * 100
      : null;

  const costRows = [
    {
      label: "Linked Fuel & Tolls",
      amount: directFuelAndTolls,
      type: "Direct",
    },
    {
      label: "Shared Weekly Fuel & Tolls",
      amount: allocatedSharedFuelAndTolls,
      type: "Allocated",
    },
    {
      label: "Allocated Weekly Fixed Costs",
      amount: allocatedFixed,
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
          <DetailKpi label="Linked Fuel & Tolls" value={money(directFuelAndTolls)} tone="red" />
          <DetailKpi
            label="Allocated Costs"
            value={money(allocatedSharedFuelAndTolls + allocatedFixed)}
            tone="amber"
          />
          <DetailKpi
            label="Est. Load Profit"
            value={estimatedProfit == null ? "—" : money(estimatedProfit)}
            tone={estimatedProfit == null || estimatedProfit >= 0 ? "green" : "red"}
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
              <Metric
                label="Loaded Miles"
                value={load.loaded_miles == null ? "—" : `${loadedMiles.toLocaleString()} mi`}
              />
              <Metric
                label="Deadhead Miles"
                value={load.deadhead_miles == null ? "—" : `${deadheadMiles.toLocaleString()} mi`}
              />
              <Metric
                label="Total Miles"
                value={totalMiles > 0 ? `${totalMiles.toLocaleString()} mi` : "—"}
              />
              <Metric label="Loaded RPM" value={money(loadedRpm)} />
              <Metric label="True RPM" value={money(trueRpm)} />
              <Metric label="Profit / Mile" value={profitPerMile == null ? "—" : money(profitPerMile)} />
              <Metric label="Profit Margin" value={margin == null ? "—" : formatPercent(margin)} />
              <Metric
                label="Cost / Mile"
                value={money(
                  allocatedCost != null && totalMiles > 0
                    ? allocatedCost / totalMiles
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
            Rate minus fuel and toll costs linked directly to this load, minus
            its mileage-based share of unlinked weekly fuel/toll costs and
            active weekly fixed costs.
            {estimatedProfit == null && profitResult?.reason
              ? ` ${profitResult.reason}`
              : ""}
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
