import Link from "next/link";
import AppShell from "@/components/app-shell";
import { EmptyState } from "@/components/fleet-ui";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import {
  dbDate,
  displayDate,
  loadBelongsToWeek,
  money,
  num,
  plusDays,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";

type SearchParams = Promise<{ week?: string; truck?: string; q?: string }>;

type Truck = {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
  status: string | null;
};

type Expense = {
  id: string;
  truck_id: string | null;
  expense_date: string | null;
  amount: number | string | null;
  vendor: string | null;
  gallons: number | string | null;
  fuel_price_per_gallon: number | string | null;
  description?: string | null;
};

type Load = {
  truck_id: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  loaded_miles: number | string | null;
  deadhead_miles: number | string | null;
  rate?: number | string | null;
};

function active(status?: string | null) {
  return (status || "").toUpperCase() !== "INACTIVE";
}

export default async function FuelPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const { supabase, fullName, companyName, role } = await getFleetPilotAccount();

  const currentStart = selectedWeek(undefined);
  let start = selectedWeek(params.week);
  if (start.getTime() > currentStart.getTime()) start = currentStart;

  const sunday = weekEnd(start);
  const startText = dbDate(start);
  const sundayText = dbDate(sunday);

  const [
    { data: truckData, error: truckError },
    fuelResult,
    loadResult,
  ] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, make, model, status")
      .order("unit_number"),
    supabase
      .from("expenses")
      .select("id, truck_id, expense_date, amount, vendor, gallons, fuel_price_per_gallon, description")
      .eq("category", "Fuel")
      .gte("expense_date", startText)
      .lte("expense_date", sundayText)
      .order("expense_date", { ascending: false }),
    supabase
      .from("loads")
      .select("truck_id, pickup_date, delivery_date, loaded_miles, deadhead_miles, rate")
      .gte("pickup_date", startText)
      .lte("pickup_date", sundayText)
      .order("pickup_date"),
  ]);

  const trucks = ((truckData ?? []) as Truck[]).filter((truck) => active(truck.status));
  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
  const allFuel = (fuelResult.data ?? []) as Expense[];
  const allLoads = ((loadResult.data ?? []) as Load[]).filter((load) =>
    loadBelongsToWeek(load.pickup_date, load.delivery_date, start)
  );

  const selectedTruckId = params.truck || "all";
  const q = (params.q || "").trim().toLowerCase();

  const fuelExpenses = allFuel.filter((expense) => {
    if (selectedTruckId !== "all" && expense.truck_id !== selectedTruckId) return false;
    if (!q) return true;
    const truck = expense.truck_id ? truckMap.get(expense.truck_id) : null;
    return [
      expense.vendor,
      expense.description,
      expense.expense_date,
      truck?.unit_number,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  const loads = allLoads.filter((load) =>
    selectedTruckId === "all" ? true : load.truck_id === selectedTruckId
  );

  const totalFuelSpend = fuelExpenses.reduce((sum, row) => sum + num(row.amount), 0);
  const totalGallons = fuelExpenses.reduce((sum, row) => sum + num(row.gallons), 0);
  const loadMiles = loads.reduce((sum, row) => sum + num(row.loaded_miles) + num(row.deadhead_miles), 0);
  const grossRevenue = loads.reduce((sum, row) => sum + num(row.rate), 0);
  const averagePrice = totalGallons > 0 ? totalFuelSpend / totalGallons : 0;
  const estimatedMpg = totalGallons > 0 ? loadMiles / totalGallons : 0;

  const byTruck = new Map<string, number>();
  for (const expense of fuelExpenses) {
    const key = expense.truck_id || "other";
    byTruck.set(key, (byTruck.get(key) || 0) + num(expense.amount));
  }

  const truckBreakdown = [...byTruck.entries()]
    .map(([id, amount], index) => ({
      id,
      label: id === "other" ? "Other" : `#${truckMap.get(id)?.unit_number || "—"}`,
      amount,
      color: ["#58bd69", "#4f8df7", "#ef6b5e", "#f2b33f", "#7356d8", "#9aa9bc"][index % 6],
    }))
    .sort((a, b) => b.amount - a.amount);

  const dayBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = plusDays(start, index);
    const key = dbDate(date);
    const cost = fuelExpenses
      .filter((expense) => expense.expense_date?.slice(0, 10) === key)
      .reduce((sum, expense) => sum + num(expense.amount), 0);
    const revenue = loads
      .filter((load) => load.pickup_date?.slice(0, 10) === key)
      .reduce((sum, load) => sum + num(load.rate), 0);
    return { date, cost, revenue };
  });

  const isCurrent = dbDate(start) === dbDate(currentStart);
  const prev = `/fuel?week=${dbDate(plusDays(start, -7))}${selectedTruckId !== "all" ? `&truck=${selectedTruckId}` : ""}`;
  const nextStart = plusDays(start, 7);
  const next = dbDate(nextStart) === dbDate(currentStart)
    ? `/fuel${selectedTruckId !== "all" ? `?truck=${selectedTruckId}` : ""}`
    : `/fuel?week=${dbDate(nextStart)}${selectedTruckId !== "all" ? `&truck=${selectedTruckId}` : ""}`;

  const dataError = truckError?.message ?? fuelResult.error?.message ?? loadResult.error?.message ?? null;

  return (
    <AppShell active="fuel" fullName={fullName} companyName={companyName} role={role}>
      <div className="fp-fuel-page">
        <section className="fp-fuel-heading">
          <div>
            <h1 className="fp-fuel-title">Fuel Analytics</h1>
            <p className="fp-fuel-subtitle">
              Track fuel costs, mileage and efficiency. Find insights to reduce your fuel expenses.
            </p>
          </div>

          <div className="fp-fuel-week-control">
            <Link href={prev}>←</Link>
            <div>
              <span>{isCurrent ? "This Week" : "Selected Week"}</span>
              <strong>{displayDate(start)} – {displayDate(sunday)}</strong>
            </div>
            {!isCurrent ? <Link href={next}>→</Link> : <span className="disabled-arrow">→</span>}
          </div>
        </section>

        {dataError && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            {dataError}
          </div>
        )}

        {trucks.length === 0 ? (
          <div className="mt-5 rounded-[12px] border border-[#e0e8f0] bg-white">
            <EmptyState text="Add an active truck to use Fuel Analytics." />
          </div>
        ) : (
          <>
            <div className="fp-fuel-kpi-grid mt-4">
              <FuelKpi label="Total Fuel Cost" value={money(totalFuelSpend)} tone="blue" icon="cost" note={`${fuelExpenses.length} fuel transactions`} />
              <FuelKpi label="Total Gallons" value={`${totalGallons.toFixed(1)} gal`} tone="green" icon="gallons" note={`${loadMiles.toLocaleString()} load miles`} />
              <FuelKpi label="Avg. Price/Gallon" value={money(averagePrice)} tone="amber" icon="price" note="Current selected period" />
              <FuelKpi label="Avg. MPG" value={estimatedMpg.toFixed(2)} tone="teal" icon="mpg" note="Based on load miles" />
            </div>

            <section className="fp-fuel-analytics-card mt-4">
              <div className="fp-fuel-tabs">
                <span className="active">Overview</span>
                <span>By Truck</span>
                <span>By Location</span>
                <span>By Vendor</span>
              </div>

              <div className="fp-fuel-overview-grid">
                <div className="fp-fuel-trend-panel">
                  <div className="flex items-center justify-between">
                    <h2>Fuel Cost Trend</h2>
                    <div className="fp-fuel-legend">
                      <span><i className="cost" />Fuel Cost</span>
                      <span><i className="revenue" />Gross Revenue</span>
                    </div>
                  </div>
                  <FuelTrendChart data={dayBuckets} />
                </div>

                <div className="fp-fuel-truck-cost-panel">
                  <h2>Fuel Costs by Truck</h2>
                  <div className="mt-4 flex justify-center">
                    <FuelDonut total={totalFuelSpend} items={truckBreakdown} />
                  </div>
                  <div className="fp-fuel-truck-list mt-4">
                    {truckBreakdown.slice(0, 5).map((item) => (
                      <FuelTruckRow key={item.id} item={item} total={totalFuelSpend} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="fp-fuel-bottom-grid mt-4">
              <section className="fp-fuel-transactions-card">
                <div className="fp-fuel-transactions-heading">
                  <h2>Fuel Transactions</h2>
                  <span>Sort by <b>Date (Newest)⌄</b></span>
                </div>

                <form className="fp-fuel-filterbar" action="/fuel">
                  {params.week && <input type="hidden" name="week" value={dbDate(start)} />}
                  <label className="fp-fuel-search">
                    <SearchIcon />
                    <input name="q" defaultValue={params.q || ""} placeholder="Search by date, truck, vendor..." />
                  </label>
                  <select name="truck" defaultValue={selectedTruckId}>
                    <option value="all">All Trucks</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>Truck #{truck.unit_number}</option>
                    ))}
                  </select>
                  <button type="button"><CalendarIcon /> Date Range</button>
                  <button type="submit"><FilterIcon /> Apply Filters</button>
                </form>

                <div className="fp-fuel-table-wrap">
                  <table className="fp-fuel-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Truck</th>
                        <th>Vendor</th>
                        <th>Gallons</th>
                        <th>Price/Gal</th>
                        <th>Total</th>
                        <th>MPG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelExpenses.map((expense, index) => {
                        const truck = expense.truck_id ? truckMap.get(expense.truck_id) : null;
                        const truckLoads = loads.filter((load) => load.truck_id === expense.truck_id);
                        const truckMiles = truckLoads.reduce((sum, load) => sum + num(load.loaded_miles) + num(load.deadhead_miles), 0);
                        const truckGallons = fuelExpenses
                          .filter((row) => row.truck_id === expense.truck_id)
                          .reduce((sum, row) => sum + num(row.gallons), 0);
                        const mpg = truckGallons > 0 ? truckMiles / truckGallons : 0;
                        return (
                          <tr key={expense.id}>
                            <td className="fp-fuel-number">#{String(index + 1).padStart(4, "0")}</td>
                            <td>{shortDate(expense.expense_date)}</td>
                            <td className="font-[650]">{truck ? `#${truck.unit_number}` : "—"}</td>
                            <td>{expense.vendor || "Unknown Vendor"}</td>
                            <td>{num(expense.gallons).toFixed(1)}</td>
                            <td>{expense.fuel_price_per_gallon == null ? "—" : money(num(expense.fuel_price_per_gallon))}</td>
                            <td className="fp-fuel-money">{money(num(expense.amount))}</td>
                            <td>{mpg > 0 ? mpg.toFixed(1) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {fuelExpenses.length === 0 && <EmptyState text="No fuel transactions for this period." />}
                </div>

                <div className="fp-fuel-table-footer">
                  <span>Showing 1–{fuelExpenses.length} of {fuelExpenses.length} transactions</span>
                  <span className="fp-fuel-page-size">10 per page⌄</span>
                </div>
              </section>

              <aside className="fp-fuel-insights-column">
                <section className="fp-fuel-insights-card">
                  <h2>Fuel Insights</h2>
                  <div className="fp-fuel-insights-list mt-3">
                    <Insight icon="trend" text={`${money(totalFuelSpend)} spent on fuel this period.`} />
                    <Insight icon="truck" text={`${truckBreakdown[0]?.label || "No truck"} has the highest fuel spend.`} />
                    <Insight icon="price" text={`Average fuel price is ${money(averagePrice)} per gallon.`} />
                    <Insight icon="mpg" text={`Estimated fleet MPG is ${estimatedMpg.toFixed(2)}.`} />
                  </div>
                </section>

                <div className="fp-fuel-promo">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#06182d]/82 via-[#06182d]/25 to-transparent" />
                  <div className="relative z-10">
                    <div className="text-[16px] font-[740] leading-[1.18] text-white">Lower Fuel Costs.<br />Higher Profits.</div>
                    <div className="mt-4 h-[3px] w-10 bg-[#4c98ff]" />
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function FuelKpi({ label, value, tone, icon, note }: {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "teal";
  icon: "cost" | "gallons" | "price" | "mpg";
  note: string;
}) {
  const palette = {
    blue: { color: "#4b8df6", soft: "#eaf3ff" },
    green: { color: "#55a965", soft: "#e9f7ed" },
    amber: { color: "#d99d2f", soft: "#fff4de" },
    teal: { color: "#2f9b8c", soft: "#e8f7f4" },
  }[tone];
  return (
    <div className="fp-fuel-kpi">
      <div className="fp-fuel-kpi-icon" style={{ color: palette.color, backgroundColor: palette.soft }}>
        <FuelKpiIcon type={icon} />
      </div>
      <div>
        <div className="fp-fuel-kpi-label">{label}</div>
        <div className="fp-number fp-fuel-kpi-value">{value}</div>
        <div className="fp-fuel-kpi-note">{note}</div>
      </div>
    </div>
  );
}

function FuelKpiIcon({ type }: { type: "cost" | "gallons" | "price" | "mpg" }) {
  if (type === "gallons") return <FuelPumpIcon />;
  if (type === "price") return <TagIcon />;
  if (type === "mpg") return <MileageIcon />;
  return <WalletIcon />;
}

function FuelTrendChart({ data }: { data: { date: Date; cost: number; revenue: number }[] }) {
  const max = Math.max(...data.flatMap((item) => [item.cost, item.revenue]), 1);
  const width = 640;
  const height = 220;
  const left = 38;
  const bottom = 28;
  const chartHeight = height - bottom - 16;
  const chartWidth = width - left - 12;
  const step = chartWidth / Math.max(1, data.length - 1);
  const points = data.map((item, index) => {
    const x = left + index * step;
    const y = 12 + chartHeight - (item.cost / max) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full">
      {[0, .25, .5, .75, 1].map((ratio) => {
        const y = 12 + chartHeight - chartHeight * ratio;
        return <line key={ratio} x1={left} y1={y} x2={width - 12} y2={y} stroke="#e9eef4" strokeWidth="1" />;
      })}
      {data.map((item, index) => {
        const x = left + index * step;
        const barHeight = (item.revenue / max) * chartHeight;
        return (
          <g key={index}>
            <rect x={x - 11} y={12 + chartHeight - barHeight} width="22" height={Math.max(2, barHeight)} rx="2" fill="#dbeafc" />
            <text x={x} y={height - 7} textAnchor="middle" fontSize="10" fill="#71839a">
              {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          </g>
        );
      })}
      <polyline points={points} fill="none" stroke="#4f8df7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((item, index) => {
        const x = left + index * step;
        const y = 12 + chartHeight - (item.cost / max) * chartHeight;
        return <circle key={index} cx={x} cy={y} r="3" fill="#fff" stroke="#4f8df7" strokeWidth="2" />;
      })}
    </svg>
  );
}

type FuelTruckItem = { id: string; label: string; amount: number; color: string };

function FuelDonut({ total, items }: { total: number; items: FuelTruckItem[] }) {
  const safe = Math.max(1, total);
  let cursor = 0;
  const stops = items.map((item) => {
    const share = (item.amount / safe) * 100;
    const from = cursor;
    const to = cursor + share;
    cursor = to;
    return `${item.color} ${from}% ${to}%`;
  });
  if (cursor < 100) stops.push(`#e7edf3 ${cursor}% 100%`);
  return (
    <div className="fp-fuel-donut" style={{ background: `conic-gradient(${stops.join(", ")})` }}>
      <div><strong>{money(total)}</strong><span>Total Fuel</span></div>
    </div>
  );
}

function FuelTruckRow({ item, total }: { item: FuelTruckItem; total: number }) {
  const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
  return (
    <div className="fp-fuel-truck-row">
      <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: item.color }} />
      <span className="flex-1">{item.label}</span>
      <strong>{money(item.amount)}</strong>
      <span>{pct}%</span>
    </div>
  );
}

function Insight({ icon, text }: { icon: "trend" | "truck" | "price" | "mpg"; text: string }) {
  return (
    <div className="fp-fuel-insight">
      <span>{icon === "truck" ? <TruckIcon /> : icon === "price" ? <TagIcon /> : icon === "mpg" ? <MileageIcon /> : <TrendIcon />}</span>
      <p>{text}</p>
    </div>
  );
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function SearchIcon(){return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>}
function CalendarIcon(){return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg>}
function FilterIcon(){return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>}
function WalletIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16v12H4z"/><path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z"/></svg>}
function FuelPumpIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M6 3h9v18H6z"/><path d="M8 7h5"/><path d="M15 8h2l2 3v6a2 2 0 0 0 2 2"/></svg>}
function TagIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 4h9l7 7-9 9-7-7V4Z"/><circle cx="9" cy="9" r="1.5"/></svg>}
function MileageIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 12l4-3M7 16h10"/></svg>}
function TruckIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>}
function TrendIcon(){return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 16l5-5 4 3 7-8"/><path d="M16 6h4v4"/></svg>}
