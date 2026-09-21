import { CHART_PALETTE, chartCategoryColor } from "@/lib/chart-palette";
import KpiTile from "@/components/kpi-tile";
import { formatPercent } from "@/lib/format";
import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { EmptyState } from "@/components/fleet-ui";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import FuelControls, { type FuelView } from "./fuel-controls";
import {
  dbDate,
  money,
  num,
  plusDays,
  selectedWeek,
  weekEnd,
} from "@/lib/fleetpilot-week";

type SearchParams = Promise<{
  week?: string;
  truck?: string;
  q?: string;
  view?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}>;

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
  description: string | null;
};

type Load = {
  truck_id: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  loaded_miles: number | string | null;
  deadhead_miles: number | string | null;
  rate: number | string | null;
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
  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const currentStart = selectedWeek(undefined);
  const cookieStore = await cookies();
  const rememberedWeek = cookieStore.get("fleetpilot_week")?.value;

  let weekStart = selectedWeek(params.week || rememberedWeek);
  if (weekStart.getTime() > currentStart.getTime()) {
    weekStart = currentStart;
  }

  const weekSunday = weekEnd(weekStart);
  const defaultFrom = dbDate(weekStart);
  const defaultTo = dbDate(weekSunday);

  const dateFrom = validDate(params.dateFrom) || defaultFrom;
  const dateTo = validDate(params.dateTo) || defaultTo;
  const rangeStart = parseDate(dateFrom);
  const rangeEnd = parseDate(dateTo);

  const view: FuelView =
    params.view === "truck"
      ? "truck"
      : params.view === "location"
        ? "location"
        : params.view === "vendor"
          ? "vendor"
          : "overview";

  const selectedTruckId = params.truck || "all";
  const q = (params.q || "").trim().toLowerCase();
  const sort = params.sort || "newest";

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
      .select(
        "id, truck_id, expense_date, amount, vendor, gallons, fuel_price_per_gallon, description"
      )
      .eq("category", "Fuel")
      .gte("expense_date", dateFrom)
      .lte("expense_date", dateTo)
      .order("expense_date", { ascending: false }),
    supabase
      .from("loads")
      .select(
        "truck_id, pickup_date, delivery_date, loaded_miles, deadhead_miles, rate"
      )
      .gte("pickup_date", dateFrom)
      .lte("pickup_date", dateTo)
      .order("pickup_date"),
  ]);

  const trucks = ((truckData ?? []) as Truck[]).filter((truck) =>
    active(truck.status)
  );
  const truckMap = new Map(trucks.map((truck) => [truck.id, truck]));
  const allFuel = (fuelResult.data ?? []) as Expense[];
  const allLoads = (loadResult.data ?? []) as Load[];

  let fuelExpenses = allFuel.filter((expense) => {
    if (
      selectedTruckId !== "all" &&
      expense.truck_id !== selectedTruckId
    ) {
      return false;
    }

    if (!q) return true;

    const truck = expense.truck_id
      ? truckMap.get(expense.truck_id)
      : null;

    return [
      expense.vendor,
      expense.description,
      expense.expense_date,
      truck?.unit_number,
      truck?.make,
      truck?.model,
    ].some((value) =>
      (value || "").toLowerCase().includes(q)
    );
  });

  fuelExpenses = [...fuelExpenses].sort((a, b) => {
    if (sort === "oldest") {
      return dateValue(a.expense_date) - dateValue(b.expense_date);
    }
    if (sort === "cost-desc") {
      return num(b.amount) - num(a.amount);
    }
    if (sort === "cost-asc") {
      return num(a.amount) - num(b.amount);
    }
    if (sort === "gallons-desc") {
      return num(b.gallons) - num(a.gallons);
    }
    if (sort === "price-desc") {
      return (
        effectivePrice(b) - effectivePrice(a)
      );
    }

    return dateValue(b.expense_date) - dateValue(a.expense_date);
  });

  const loads = allLoads.filter((load) =>
    selectedTruckId === "all"
      ? true
      : load.truck_id === selectedTruckId
  );

  const totalFuelSpend = fuelExpenses.reduce(
    (sum, row) => sum + num(row.amount),
    0
  );
  const totalGallons = fuelExpenses.reduce(
    (sum, row) => sum + num(row.gallons),
    0
  );
  const loadMiles = loads.reduce(
    (sum, row) =>
      sum + num(row.loaded_miles) + num(row.deadhead_miles),
    0
  );
  const grossRevenue = loads.reduce(
    (sum, row) => sum + num(row.rate),
    0
  );
  const averagePrice =
    totalGallons > 0 ? totalFuelSpend / totalGallons : 0;
  const estimatedMpg =
    totalGallons > 0 ? loadMiles / totalGallons : 0;

  const byTruck = groupFuel(
    fuelExpenses,
    (expense) => expense.truck_id || "other",
    (key) =>
      key === "other"
        ? "Other / Unassigned"
        : `Truck #${truckMap.get(key)?.unit_number || "—"}`
  );

  const byVendor = groupFuel(
    fuelExpenses,
    (expense) => normalizeLabel(expense.vendor, "Unknown Vendor"),
    (key) => key
  );

  // Current expense schema has no dedicated fuel-location field.
  // When a description contains a purchase location, use it; otherwise
  // fall back to the vendor so the Location view remains data-backed.
  const byLocation = groupFuel(
    fuelExpenses,
    (expense) =>
      normalizeLabel(
        expense.description || expense.vendor,
        "Unknown Location"
      ),
    (key) => key
  );

  const rangeDays = Math.max(
    1,
    Math.round(
      (rangeEnd.getTime() - rangeStart.getTime()) /
        (24 * 60 * 60 * 1000)
    ) + 1
  );

  const bucketCount = Math.min(rangeDays, 14);
  const bucketStep = Math.max(1, Math.ceil(rangeDays / bucketCount));

  const trendBuckets = Array.from(
    { length: Math.ceil(rangeDays / bucketStep) },
    (_, index) => {
      const from = plusDays(rangeStart, index * bucketStep);
      const to = plusDays(
        rangeStart,
        Math.min(rangeDays - 1, (index + 1) * bucketStep - 1)
      );
      const fromKey = dbDate(from);
      const toKey = dbDate(to);

      const cost = fuelExpenses
        .filter((expense) => {
          const date = expense.expense_date?.slice(0, 10) || "";
          return date >= fromKey && date <= toKey;
        })
        .reduce((sum, expense) => sum + num(expense.amount), 0);

      const revenue = loads
        .filter((load) => {
          const date = load.pickup_date?.slice(0, 10) || "";
          return date >= fromKey && date <= toKey;
        })
        .reduce((sum, load) => sum + num(load.rate), 0);

      return {
        date: from,
        label:
          bucketStep === 1
            ? shortDateNoYear(fromKey)
            : `${shortDateNoYear(fromKey)}–${shortDateNoYear(toKey)}`,
        cost,
        revenue,
      };
    }
  );

  const dataError =
    truckError?.message ??
    fuelResult.error?.message ??
    loadResult.error?.message ??
    null;

  const topSpend =
    view === "truck"
      ? byTruck[0]
      : view === "vendor"
        ? byVendor[0]
        : view === "location"
          ? byLocation[0]
          : null;

  return (
    <AppShell
      active="fuel"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-fuel-page">
        <section className="fp-fuel-heading">
          <div>
            <h1 className="fp-fuel-title">Fuel Analytics</h1>
            <p className="fp-fuel-subtitle">
              Track fuel costs, mileage and efficiency. Find insights to
              reduce your fuel expenses.
            </p>
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
              <KpiTile
                label="Total Fuel Cost"
                                value={money(totalFuelSpend)}
                                note={`${fuelExpenses.length} filtered transactions`}
              />
              <KpiTile
                label="Total Gallons"
                                value={`${totalGallons.toFixed(1)} gal`}
                                note={`${loadMiles.toLocaleString()} load miles`}
              />
              <KpiTile
                label="Avg. Price/Gallon"
                                value={money(averagePrice)}
                                note={`${shortDate(dateFrom)} – ${shortDate(dateTo)}`}
              />
              <KpiTile
                label="Avg. MPG"
                                value={estimatedMpg.toFixed(2)}
                                note="Based on filtered load miles"
              />
            </div>

            <section className="fp-fuel-analytics-card mt-4">
              <FuelControls
                view={view}
                trucks={trucks.map((truck) => ({
                  id: truck.id,
                  unit_number: truck.unit_number,
                }))}
                defaultFrom={defaultFrom}
                defaultTo={defaultTo}
              />

              {view === "overview" && (
                <div className="fp-fuel-overview-grid">
                  <div className="fp-fuel-trend-panel">
                    <div className="flex items-center justify-between">
                      <h2>Fuel Cost Trend</h2>
                      <div className="fp-fuel-legend">
                        <span>
                          <i
                            className="cost"
                            style={{ backgroundColor: CHART_PALETTE.green }}
                          />
                          Fuel Cost
                        </span>
                        <span>
                          <i
                            className="revenue"
                            style={{ backgroundColor: CHART_PALETTE.navy }}
                          />
                          Gross Revenue
                        </span>
                      </div>
                    </div>
                    <FuelTrendChart data={trendBuckets} />
                  </div>

                  <div className="fp-fuel-truck-cost-panel">
                    <h2>Fuel Costs by Truck</h2>
                    <div className="mt-4 flex justify-center">
                      <FuelDonut
                        total={totalFuelSpend}
                        items={byTruck}
                      />
                    </div>
                    <div className="fp-fuel-truck-list mt-4">
                      {byTruck.slice(0, 5).map((item) => (
                        <FuelGroupRow
                          key={item.id}
                          item={item}
                          total={totalFuelSpend}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {view === "truck" && (
                <FuelBreakdownView
                  title="Fuel Performance by Truck"
                  subtitle="Compare spend, gallons, average price and efficiency across trucks."
                  rows={byTruck}
                  total={totalFuelSpend}
                  empty="No truck fuel data for the current filters."
                />
              )}

              {view === "vendor" && (
                <FuelBreakdownView
                  title="Fuel Spend by Vendor"
                  subtitle="See where fuel dollars are going and which vendors dominate the period."
                  rows={byVendor}
                  total={totalFuelSpend}
                  empty="No vendor fuel data for the current filters."
                />
              )}

              {view === "location" && (
                <FuelBreakdownView
                  title="Fuel Spend by Location"
                  subtitle="Uses the fuel transaction description as location when available, otherwise vendor."
                  rows={byLocation}
                  total={totalFuelSpend}
                  empty="No location information for the current filters."
                />
              )}
            </section>

            <div className="fp-fuel-bottom-grid mt-4">
              <section className="fp-fuel-transactions-card">
                <div className="fp-fuel-transactions-heading">
                  <div>
                    <h2>Fuel Transactions</h2>
                    <small>
                      {shortDate(dateFrom)} – {shortDate(dateTo)}
                    </small>
                  </div>
                  <span>
                    Sort by <b>{sortLabel(sort)}</b>
                  </span>
                </div>

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
                        const truck = expense.truck_id
                          ? truckMap.get(expense.truck_id)
                          : null;
                        const truckLoads = loads.filter(
                          (load) =>
                            load.truck_id === expense.truck_id
                        );
                        const truckMiles = truckLoads.reduce(
                          (sum, load) =>
                            sum +
                            num(load.loaded_miles) +
                            num(load.deadhead_miles),
                          0
                        );
                        const truckGallons = fuelExpenses
                          .filter(
                            (row) =>
                              row.truck_id === expense.truck_id
                          )
                          .reduce(
                            (sum, row) => sum + num(row.gallons),
                            0
                          );
                        const mpg =
                          truckGallons > 0
                            ? truckMiles / truckGallons
                            : 0;

                        return (
                          <tr key={expense.id}>
                            <td className="fp-fuel-number">
                              #
                              {String(index + 1).padStart(4, "0")}
                            </td>
                            <td>{shortDate(expense.expense_date)}</td>
                            <td className="font-[700]">
                              {truck ? `#${truck.unit_number}` : "—"}
                            </td>
                            <td>
                              {expense.vendor || "Unknown Vendor"}
                            </td>
                            <td>
                              {num(expense.gallons).toFixed(1)}
                            </td>
                            <td>
                              {money(effectivePrice(expense))}
                            </td>
                            <td className="fp-fuel-money">
                              {money(num(expense.amount))}
                            </td>
                            <td>
                              {mpg > 0 ? mpg.toFixed(1) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {fuelExpenses.length === 0 && (
                    <EmptyState text="No fuel transactions match the current filters." />
                  )}
                </div>

                <div className="fp-fuel-table-footer">
                  <span>
                    Showing {fuelExpenses.length} filtered transactions
                  </span>
                  <span className="fp-fuel-page-size">
                    {view === "overview"
                      ? "Overview"
                      : view === "truck"
                        ? "By Truck"
                        : view === "vendor"
                          ? "By Vendor"
                          : "By Location"}
                  </span>
                </div>
              </section>

              <aside className="fp-fuel-insights-column">
                <section className="fp-fuel-insights-card">
                  <h2>Fuel Insights</h2>
                  <div className="fp-fuel-insights-list mt-3">
                    <Insight
                      icon="trend"
                      text={`${money(totalFuelSpend)} spent on fuel in the filtered period.`}
                    />
                    <Insight
                      icon="truck"
                      text={`${
                        byTruck[0]?.label || "No truck"
                      } has the highest truck fuel spend.`}
                    />
                    <Insight
                      icon="price"
                      text={`Average fuel price is ${money(
                        averagePrice
                      )} per gallon.`}
                    />
                    <Insight
                      icon="mpg"
                      text={`Estimated fleet MPG is ${estimatedMpg.toFixed(
                        2
                      )}.`}
                    />
                    {topSpend && (
                      <Insight
                        icon="trend"
                        text={`${topSpend.label} leads this view with ${money(
                          topSpend.amount
                        )}.`}
                      />
                    )}
                  </div>
                </section>

                <div className="fp-fuel-promo">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#06182d]/82 via-[#06182d]/25 to-transparent" />
                  <div className="relative z-10">
                    <div className="text-[16px] font-[700] leading-[1.18] text-white">
                      Lower Fuel Costs.
                      <br />
                      Higher Profits.
                    </div>
                    <div className="mt-4 h-[3px] w-10 bg-[#16853B]" />
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

type FuelGroupItem = {
  id: string;
  label: string;
  amount: number;
  gallons: number;
  transactions: number;
  avgPrice: number;
  color: string;
};

function groupFuel(
  expenses: Expense[],
  keyFn: (expense: Expense) => string,
  labelFn: (key: string) => string
) {
  const map = new Map<
    string,
    { amount: number; gallons: number; transactions: number }
  >();

  for (const expense of expenses) {
    const key = keyFn(expense);
    const current = map.get(key) || {
      amount: 0,
      gallons: 0,
      transactions: 0,
    };

    current.amount += num(expense.amount);
    current.gallons += num(expense.gallons);
    current.transactions += 1;
    map.set(key, current);
  }

  const colors = [
    chartCategoryColor(0),
    chartCategoryColor(1),
    chartCategoryColor(2),
    chartCategoryColor(3),
    chartCategoryColor(4),
  ];

  return [...map.entries()]
    .map(([id, value], index) => ({
      id,
      label: labelFn(id),
      amount: value.amount,
      gallons: value.gallons,
      transactions: value.transactions,
      avgPrice:
        value.gallons > 0 ? value.amount / value.gallons : 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.amount - a.amount);
}

function FuelBreakdownView({
  title,
  subtitle,
  rows,
  total,
  empty,
}: {
  title: string;
  subtitle: string;
  rows: FuelGroupItem[];
  total: number;
  empty: string;
}) {
  return (
    <div className="fp-fuel-breakdown-view">
      <div className="fp-fuel-breakdown-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <strong>{money(total)}</strong>
      </div>

      {rows.length > 0 ? (
        <div className="fp-fuel-breakdown-table-wrap">
          <table className="fp-fuel-breakdown-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Transactions</th>
                <th>Gallons</th>
                <th>Avg. Price/Gal</th>
                <th>Total Spend</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span
                      className="fp-fuel-breakdown-dot"
                      style={{ backgroundColor: row.color }}
                    />
                    <strong>{row.label}</strong>
                  </td>
                  <td>{row.transactions}</td>
                  <td>{row.gallons.toFixed(1)}</td>
                  <td>{money(row.avgPrice)}</td>
                  <td className="fp-fuel-money">
                    {money(row.amount)}
                  </td>
                  <td>
                    {total > 0
                      ? formatPercent((row.amount / total) * 100)
                      : "0.0%"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState text={empty} />
      )}
    </div>
  );
}



function FuelTrendChart({
  data,
}: {
  data: {
    date: Date;
    label: string;
    cost: number;
    revenue: number;
  }[];
}) {
  const max = Math.max(
    ...data.flatMap((item) => [item.cost, item.revenue]),
    1
  );
  const width = 640;
  const height = 220;
  const left = 38;
  const bottom = 28;
  const chartHeight = height - bottom - 16;
  const chartWidth = width - left - 12;
  const step = chartWidth / Math.max(1, data.length - 1);
  const points = data
    .map((item, index) => {
      const x = left + index * step;
      const y =
        12 + chartHeight - (item.cost / max) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 w-full"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y =
          12 + chartHeight - chartHeight * ratio;
        return (
          <line
            key={ratio}
            x1={left}
            y1={y}
            x2={width - 12}
            y2={y}
            stroke="#e9eef4"
            strokeWidth="1"
          />
        );
      })}

      {data.map((item, index) => {
        const x = left + index * step;
        const barHeight =
          (item.revenue / max) * chartHeight;

        return (
          <g key={index}>
            <rect
              x={x - 11}
              y={12 + chartHeight - barHeight}
              width="22"
              height={Math.max(2, barHeight)}
              rx="2"
              fill={CHART_PALETTE.navy}
            />
            <text
              x={x}
              y={height - 7}
              textAnchor="middle"
              fontSize="9"
              fill="#71839a"
            >
              {item.label}
            </text>
          </g>
        );
      })}

      <polyline
        points={points}
        fill="none"
        stroke={CHART_PALETTE.green}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((item, index) => {
        const x = left + index * step;
        const y =
          12 + chartHeight - (item.cost / max) * chartHeight;

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="3"
            fill="#fff"
            stroke={CHART_PALETTE.green}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

function FuelDonut({
  total,
  items,
}: {
  total: number;
  items: FuelGroupItem[];
}) {
  const safe = Math.max(1, total);
  let cursor = 0;

  const stops = items.map((item) => {
    const share = (item.amount / safe) * 100;
    const from = cursor;
    const to = cursor + share;
    cursor = to;
    return `${item.color} ${from}% ${to}%`;
  });

  if (cursor < 100) {
    stops.push(`#e7edf3 ${cursor}% 100%`);
  }

  return (
    <div
      className="fp-fuel-donut"
      style={{
        background: `conic-gradient(${stops.join(", ")})`,
      }}
    >
      <div>
        <strong>{money(total)}</strong>
        <span>Total Fuel</span>
      </div>
    </div>
  );
}

function FuelGroupRow({
  item,
  total,
}: {
  item: FuelGroupItem;
  total: number;
}) {
  const pct =
    total > 0
      ? Math.round((item.amount / total) * 100)
      : 0;

  return (
    <div className="fp-fuel-truck-row">
      <span
        className="h-[9px] w-[9px] rounded-full"
        style={{ backgroundColor: item.color }}
      />
      <span className="flex-1">{item.label}</span>
      <strong>{money(item.amount)}</strong>
      <span>{pct}%</span>
    </div>
  );
}

function Insight({
  icon,
  text,
}: {
  icon: "trend" | "truck" | "price" | "mpg";
  text: string;
}) {
  return (
    <div className="fp-fuel-insight">
      <span>
        {icon === "truck" ? (
          <TruckIcon />
        ) : icon === "price" ? (
          <TagIcon />
        ) : icon === "mpg" ? (
          <MileageIcon />
        ) : (
          <TrendIcon />
        )}
      </span>
      <p>{text}</p>
    </div>
  );
}

function normalizeLabel(value: string | null | undefined, fallback: string) {
  return (value || "").trim() || fallback;
}

function effectivePrice(expense: Expense) {
  if (expense.fuel_price_per_gallon != null) {
    return num(expense.fuel_price_per_gallon);
  }

  const gallons = num(expense.gallons);
  return gallons > 0 ? num(expense.amount) / gallons : 0;
}

function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return value;
}

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(`${value.slice(0, 10)}T12:00:00`);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(
    `${value.slice(0, 10)}T12:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDateNoYear(value?: string | null) {
  if (!value) return "—";
  return new Date(
    `${value.slice(0, 10)}T12:00:00`
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function sortLabel(sort: string) {
  if (sort === "oldest") return "Date (Oldest)";
  if (sort === "cost-desc") return "Cost (Highest)";
  if (sort === "cost-asc") return "Cost (Lowest)";
  if (sort === "gallons-desc") return "Gallons (Highest)";
  if (sort === "price-desc") return "Price/Gal (Highest)";
  return "Date (Newest)";
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 6h16v12H4z" />
      <path d="M16 10h5v4h-5a2 2 0 0 1 0-4Z" />
    </svg>
  );
}

function FuelPumpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M6 3h9v18H6z" />
      <path d="M8 7h5" />
      <path d="M15 8h2l2 3v6a2 2 0 0 0 2 2" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 4h9l7 7-9 9-7-7V4Z" />
      <circle cx="9" cy="9" r="1.5" />
    </svg>
  );
}

function MileageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12l4-3M7 16h10" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px] fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 16l5-5 4 3 7-8" />
      <path d="M16 6h4v4" />
    </svg>
  );
}
