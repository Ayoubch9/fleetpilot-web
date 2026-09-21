import {
  calculateLoadProfitabilityMap,
  effectiveLoadStatus,
  normalizeLoadStatus,
  normalizeUsLocation,
} from "@/lib/load-domain";
import AppTabs from "@/components/app-tabs";
import KpiTile from "@/components/kpi-tile";
import { formatMoney, formatPercent } from "@/lib/format";
import Link from "next/link";
import { cookies } from "next/headers";
import AppShell from "@/components/app-shell";
import { StatusBadge } from "@/components/fleet-ui";
import { getMileVoxaAccount } from "@/lib/fleetpilot-account";
import AddLoadForm from "./add-load-form";
import LoadsQuickActions from "./loads-quick-actions";
import LoadActions from "./load-actions";
import LoadFilters from "./load-filters";
import LoadEmptyState from "./load-empty-state";
import LoadPeriodSelector from "./load-period-selector";
import {
  dbDate,
  monday,
  parseDate,
  plusDays,
  weekEnd,
} from "@/lib/fleetpilot-week";

type Load = {
  id: string;
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
  truck_id: string | null;
};

type Truck = {
  id: string;
  unit_number: string;
  make: string | null;
  model: string | null;
  status?: string | null;
};

type Expense = {
  load_id: string | null;
  amount: number | string | null;
  category: string | null;
  expense_date: string | null;
};

type FixedExpense = {
  amount: number | string | null;
  is_active?: boolean | null;
  active?: boolean | null;
};

type Params = {
  q?: string;
  status?: string;
  page?: string;
  sort?: string;
  dateFrom?: string;
  dateTo?: string;
  truck?: string;
  broker?: string;
  minRate?: string;
  maxRate?: string;
  minMiles?: string;
  maxMiles?: string;
  period?: string;
  week?: string;
};

const PAGE_SIZE = 10;

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const filter = (params.status || "all").toLowerCase();
  const sort = (params.sort || "newest").toLowerCase();
  const dateFrom = params.dateFrom || "";
  const dateTo = params.dateTo || "";
  const truckFilter = params.truck || "";
  const brokerFilter = (params.broker || "").trim().toLowerCase();
  const minRate = numberParam(params.minRate);
  const maxRate = numberParam(params.maxRate);
  const minMiles = numberParam(params.minMiles);
  const maxMiles = numberParam(params.maxMiles);
  const requestedPeriod = (params.period || "week").toLowerCase();
  const period =
    requestedPeriod === "month" || requestedPeriod === "all"
      ? requestedPeriod
      : requestedPeriod === "custom"
        ? "custom"
        : "week";
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);

  const cookieStore = await cookies();
  const rememberedWeek = cookieStore.get("fleetpilot_week")?.value;
  const selectedWeekStart = monday(
    parseDate(params.week || rememberedWeek) || new Date()
  );
  const selectedWeekEnd = weekEnd(selectedWeekStart);

  const { supabase, fullName, companyName, role } =
    await getMileVoxaAccount();

  const [
    { data: loadData, error: loadError },
    { data: truckData, error: truckError },
    { data: expenseData, error: expenseError },
    { data: fixedExpenseData, error: fixedExpenseError },
  ] = await Promise.all([
    supabase
      .from("loads")
      .select(
        "id, load_number, broker, pickup, delivery, pickup_date, delivery_date, rate, loaded_miles, deadhead_miles, status, truck_id"
      )
      .order("pickup_date", { ascending: false }),
    supabase
      .from("trucks")
      .select("id, unit_number, make, model, status")
      .order("unit_number"),
    supabase
      .from("expenses")
      .select("load_id, amount, category, expense_date"),
    supabase.from("weekly_fixed_expenses").select("*"),
  ]);

  const lifecycleNow = new Date();
  const allLoads = ((loadData ?? []) as Load[]).map((load) => ({
    ...load,
    status: effectiveLoadStatus(load.status, load.pickup_date, lifecycleNow),
  }));
  const trucks = ((truckData ?? []) as Truck[]).filter(
    (truck) => (truck.status || "").toUpperCase() !== "INACTIVE"
  );
  const expenses = (expenseData ?? []) as Expense[];
  const fixedExpenses = (fixedExpenseData ?? []) as FixedExpense[];

  const profitability = calculateLoadProfitabilityMap({
    loads: allLoads,
    expenses,
    fixedExpenses,
    expenseSourceAvailable: !expenseError,
    fixedExpenseSourceAvailable: !fixedExpenseError,
  });

  const loadProfit = (load: Load) =>
    profitability.get(load.id)?.profit ?? null;

  const selectedWeekMidpoint = plusDays(selectedWeekStart, 3);
  const monthStart = new Date(
    selectedWeekMidpoint.getFullYear(),
    selectedWeekMidpoint.getMonth(),
    1
  );
  const monthEnd = new Date(
    selectedWeekMidpoint.getFullYear(),
    selectedWeekMidpoint.getMonth() + 1,
    0
  );

  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  let periodLabel = "All Time";

  if (period === "week") {
    periodStart = selectedWeekStart;
    periodEnd = selectedWeekEnd;
    periodLabel = `${formatShortDate(periodStart)} – ${formatShortDate(periodEnd)}`;
  } else if (period === "month") {
    periodStart = monthStart;
    periodEnd = monthEnd;
    periodLabel = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(monthStart);
  } else if (period === "custom" && (dateFrom || dateTo)) {
    periodStart = dateFrom ? parseDate(dateFrom) : null;
    periodEnd = dateTo ? parseDate(dateTo) : null;
    periodLabel = customRangeLabel(dateFrom, dateTo);
  }

  const periodLoads =
    period === "all"
      ? allLoads
      : allLoads.filter((load) =>
          loadInDateWindow(load, periodStart, periodEnd)
        );

  let previousPeriodLoads: Load[] | null = null;
  let comparisonLabel = "";

  if (period === "week") {
    const previousStart = plusDays(selectedWeekStart, -7);
    const previousEnd = plusDays(selectedWeekEnd, -7);
    previousPeriodLoads = allLoads.filter((load) =>
      loadInDateWindow(load, previousStart, previousEnd)
    );
    comparisonLabel = "vs previous week";
  } else if (period === "month") {
    const previousMonthStart = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      0
    );
    previousPeriodLoads = allLoads.filter((load) =>
      loadInDateWindow(load, previousMonthStart, previousMonthEnd)
    );
    comparisonLabel = "vs previous month";
  }

  const counts = {
    all: periodLoads.length,
    active: periodLoads.filter((load) => isActive(load.status)).length,
    completed: periodLoads.filter((load) => isCompleted(load.status)).length,
    dispatched: periodLoads.filter(
      (load) => normalizedStatus(load.status) === "DISPATCHED"
    ).length,
    cancelled: periodLoads.filter(
      (load) => normalizedStatus(load.status) === "CANCELLED"
    ).length,
    expired: periodLoads.filter(
      (load) => normalizedStatus(load.status) === "EXPIRED"
    ).length,
  };

  const totalRevenue = periodLoads.reduce(
    (sum, load) => sum + numberValue(load.rate),
    0
  );
  const periodProfitValues = periodLoads.map((load) => loadProfit(load));
  const profitAllocationComplete = periodProfitValues.every(
    (value) => value != null
  );
  const totalProfit = profitAllocationComplete
    ? periodProfitValues.reduce((sum, value) => sum + (value ?? 0), 0)
    : null;
  const avgProfit =
    profitAllocationComplete && periodLoads.length > 0 && totalProfit != null
      ? totalProfit / periodLoads.length
      : totalProfit == null
        ? null
        : 0;

  const previousRevenue = previousPeriodLoads?.reduce(
    (sum, load) => sum + numberValue(load.rate),
    0
  );
  const previousProfitValues = previousPeriodLoads?.map((load) =>
    loadProfit(load)
  );
  const previousProfit =
    previousProfitValues &&
    previousProfitValues.every((value) => value != null)
      ? previousProfitValues.reduce((sum, value) => sum + (value ?? 0), 0)
      : undefined;
  const previousAvgProfit =
    previousPeriodLoads && previousPeriodLoads.length > 0 && previousProfit != null
      ? previousProfit / previousPeriodLoads.length
      : previousPeriodLoads && previousPeriodLoads.length === 0
        ? 0
        : undefined;

  const loadChange = metricChange(
    counts.all,
    previousPeriodLoads?.length,
    comparisonLabel,
    period,
    periodLabel
  );
  const revenueChange = metricChange(
    totalRevenue,
    previousRevenue,
    comparisonLabel,
    period,
    periodLabel
  );
  const profitChange =
    totalProfit == null
      ? { change: "—", note: "cost allocation incomplete" }
      : metricChange(
          totalProfit,
          previousProfit,
          comparisonLabel,
          period,
          periodLabel
        );
  const avgProfitChange =
    avgProfit == null
      ? { change: "—", note: "cost allocation incomplete" }
      : metricChange(
          avgProfit,
          previousAvgProfit,
          comparisonLabel,
          period,
          periodLabel
        );

  let filteredLoads = periodLoads.filter((load) => {
    if (!q) return true;
    return [
      load.load_number,
      load.broker,
      load.pickup,
      load.delivery,
      load.status,
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (filter !== "all") {
    filteredLoads = filteredLoads.filter((load) => {
      const status = normalizedStatus(load.status);
      if (filter === "active") return isActive(status);
      if (filter === "upcoming") return status === "UPCOMING";
      if (filter === "in-transit") return status === "IN TRANSIT";
      if (filter === "completed") return isCompleted(status);
      if (filter === "dispatched") return status === "DISPATCHED";
      if (filter === "cancelled") return status === "CANCELLED";
      return true;
    });
  }

  if (dateFrom) {
    const from = dateValue(dateFrom);
    filteredLoads = filteredLoads.filter(
      (load) => dateValue(load.pickup_date) >= from
    );
  }

  if (dateTo) {
    const to = dateValue(dateTo);
    filteredLoads = filteredLoads.filter(
      (load) => dateValue(load.pickup_date) <= to
    );
  }

  if (truckFilter) {
    filteredLoads = filteredLoads.filter(
      (load) => load.truck_id === truckFilter
    );
  }

  if (brokerFilter) {
    filteredLoads = filteredLoads.filter((load) =>
      (load.broker || "").toLowerCase().includes(brokerFilter)
    );
  }

  filteredLoads = filteredLoads.filter((load) => {
    const rate = numberValue(load.rate);
    const miles =
      numberValue(load.loaded_miles) + numberValue(load.deadhead_miles);

    if (minRate != null && rate < minRate) return false;
    if (maxRate != null && rate > maxRate) return false;
    if (minMiles != null && miles < minMiles) return false;
    if (maxMiles != null && miles > maxMiles) return false;

    return true;
  });

  filteredLoads = [...filteredLoads].sort((a, b) => {
    const aMiles =
      numberValue(a.loaded_miles) + numberValue(a.deadhead_miles);
    const bMiles =
      numberValue(b.loaded_miles) + numberValue(b.deadhead_miles);

    if (sort === "oldest") {
      return dateValue(a.pickup_date) - dateValue(b.pickup_date);
    }
    if (sort === "delivery-newest") {
      return dateValue(b.delivery_date) - dateValue(a.delivery_date);
    }
    if (sort === "rate") {
      return numberValue(b.rate) - numberValue(a.rate);
    }
    if (sort === "rate-low") {
      return numberValue(a.rate) - numberValue(b.rate);
    }
    if (sort === "profit" || sort === "profit-low") {
      const aProfit = loadProfit(a);
      const bProfit = loadProfit(b);
      if (aProfit == null && bProfit == null) return 0;
      if (aProfit == null) return 1;
      if (bProfit == null) return -1;
      return sort === "profit" ? bProfit - aProfit : aProfit - bProfit;
    }
    if (sort === "miles") {
      return bMiles - aMiles;
    }
    if (sort === "miles-low") {
      return aMiles - bMiles;
    }
    return dateValue(b.pickup_date) - dateValue(a.pickup_date);
  });

  const pageCount = Math.max(1, Math.ceil(filteredLoads.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageLoads = filteredLoads.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const laneMap = new Map<string, number>();
  for (const load of periodLoads) {
    const route = `${compactLocation(load.pickup)} → ${compactLocation(
      load.delivery
    )}`;
    laneMap.set(route, (laneMap.get(route) || 0) + 1);
  }
  const topLanes = [...laneMap.entries()]
    .filter(([route]) => !route.includes("—"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (filter !== "all") query.set("status", filter);
  if (sort !== "newest") query.set("sort", sort);
  if (dateFrom) query.set("dateFrom", dateFrom);
  if (dateTo) query.set("dateTo", dateTo);
  if (truckFilter) query.set("truck", truckFilter);
  if (brokerFilter) query.set("broker", brokerFilter);
  if (minRate != null) query.set("minRate", String(minRate));
  if (maxRate != null) query.set("maxRate", String(maxRate));
  if (minMiles != null) query.set("minMiles", String(minMiles));
  if (maxMiles != null) query.set("maxMiles", String(maxMiles));
  if (period !== "week") query.set("period", period);
  if (params.week) query.set("week", params.week);

  const exportLoads = filteredLoads.map((load) => ({
    ...load,
    profit: loadProfit(load),
  }));

  const errors = [
    loadError,
    truckError,
    expenseError,
    fixedExpenseError,
  ].filter(Boolean);

  return (
    <AppShell
      active="loads"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-loads-page">
        <section className="fp-loads-heading">
          <div>
            <h1 className="fp-loads-title">Loads</h1>
            <p className="fp-loads-subtitle">
              Manage your loads, track profits, and keep your business moving.
            </p>
          </div>

          <div id="add-load" className="fp-load-add-form-host">
            <AddLoadForm trucks={trucks} />
          </div>
        </section>

        {errors.length > 0 && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            Some load data could not be loaded. Successfully returned data is
            still shown.
          </div>
        )}

        <div className="fp-loads-layout mt-4">
          <div className="min-w-0">
            <LoadPeriodSelector
              label={periodLabel}
              isCustom={period === "custom"}
            />

            <div className="fp-load-kpi-grid mt-3">
              <KpiTile
                label="Total Loads"
                                value={`${counts.all}`}
                                delta={loadChange.change}
                                note={loadChange.note}
              />
              <KpiTile
                label="Total Revenue"
                                value={money(totalRevenue)}
                                delta={revenueChange.change}
                                note={revenueChange.note}
              />
              <KpiTile
                label="Total Profit"
                                value={totalProfit == null ? "—" : money(totalProfit)}
                                delta={profitChange.change}
                                note={profitChange.note}
              />
              <KpiTile
                label="Avg. Profit per Load"
                                value={avgProfit == null ? "—" : money(avgProfit)}
                                delta={avgProfitChange.change}
                                note={avgProfitChange.note}
              />
            </div>

            <section className="fp-loads-table-card mt-4">
              <AppTabs
                activeKey={filter}
                ariaLabel="Load status"
                items={[
                  { key: "all", label: "All Loads", count: counts.all, href: statusHref(query, "all") },
                  { key: "active", label: "Active", count: counts.active, href: statusHref(query, "active") },
                  { key: "completed", label: "Completed", count: counts.completed, href: statusHref(query, "completed") },
                  { key: "dispatched", label: "Dispatched", count: counts.dispatched, href: statusHref(query, "dispatched") },
                  { key: "expired", label: "Expired", count: counts.expired, href: statusHref(query, "expired") },
                ]}
              />

              <LoadFilters
                trucks={trucks.map((truck) => ({
                  id: truck.id,
                  unit_number: truck.unit_number,
                }))}
              />

              <div className="fp-load-table-wrap">
                <table className="fp-load-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Route</th>
                      <th>Pickup</th>
                      <th>Delivery</th>
                      <th>Miles</th>
                      <th>Rate</th>
                      <th>Profit</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {pageLoads.map((load) => {
                      const miles = Math.round(
                        numberValue(load.loaded_miles) +
                          numberValue(load.deadhead_miles)
                      );
                      const hasVerifiedMiles = miles > 0;
                      const rate = numberValue(load.rate);
                      const profitResult = profitability.get(load.id);
                      const profit = profitResult?.profit ?? null;

                      return (
                        <tr key={load.id}>
                          <td className="fp-load-number">
                            <Link
                              href={`/loads/${load.id}`}
                              className="fp-table-profile-link"
                            >
                              #{load.load_number || "—"}
                            </Link>
                          </td>
                          <td className="fp-load-route-cell">
                            {compactLocation(load.pickup)}
                            <span> → </span>
                            {compactLocation(load.delivery)}
                          </td>
                          <td>
                            <DateCell value={load.pickup_date} />
                          </td>
                          <td>
                            <DateCell value={load.delivery_date} />
                          </td>
                          <td>{hasVerifiedMiles ? miles.toLocaleString() : "—"}</td>
                          <td className="fp-load-rate">{money(rate)}</td>
                          <td
                             className={
                               profit == null
                                 ? "fp-load-profit-unavailable"
                                 : profit >= 0
                                   ? "fp-load-profit-positive"
                                   : "fp-load-profit-negative"
                             }
                             title={
                               profit == null
                                 ? profitResult?.reason ||
                                   "Profit unavailable until costs can be allocated."
                                 : "Rate less linked fuel/tolls and allocated weekly fixed costs."
                             }
                           >
                             {profit == null ? "—" : money(profit)}
                           </td>
                          <td>
                            <StatusBadge tone={tone(load.status)}>
                              {displayStatus(load.status)}
                            </StatusBadge>
                          </td>
                          <td className="fp-load-actions-cell">
                            <LoadActions
                              load={load}
                              trucks={trucks.map((truck) => ({
                                id: truck.id,
                                unit_number: truck.unit_number,
                              }))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {pageLoads.length === 0 && <LoadEmptyState />}
              </div>

              <div className="fp-load-pagination">
                <span>
                  Showing{" "}
                  {filteredLoads.length === 0
                    ? 0
                    : (page - 1) * PAGE_SIZE + 1}
                  –{Math.min(page * PAGE_SIZE, filteredLoads.length)} of{" "}
                  {filteredLoads.length} loads
                </span>

                <div className="flex items-center gap-1.5">
                  <PageLink
                    href={pageHref(query, Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    «
                  </PageLink>

                  {Array.from({ length: Math.min(3, pageCount) }).map(
                    (_, index) => {
                      const number = index + 1;
                      return (
                        <PageLink
                          key={number}
                          href={pageHref(query, number)}
                          active={number === page}
                        >
                          {number}
                        </PageLink>
                      );
                    }
                  )}

                  <PageLink
                    href={pageHref(query, Math.min(pageCount, page + 1))}
                    disabled={page === pageCount}
                  >
                    »
                  </PageLink>

                  <span className="fp-page-size">10 per page⌄</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="fp-loads-right-rail">
            <section className="fp-load-side-card fp-load-quick-card">
              <h2>Quick Actions</h2>
              <LoadsQuickActions
                loads={allLoads}
                exportLoads={exportLoads}
              />
            </section>

            <section className="fp-load-side-card">
              <h2>Load Statistics</h2>
              <div className="mt-4 flex justify-center">
                <LoadDonut counts={counts} />
              </div>

              <div className="fp-load-stat-list mt-4">
                <LoadStatRow
                  label="Completed"
                  value={counts.completed}
                  total={counts.all}
                  color="#54bd75"
                />
                <LoadStatRow
                  label="Active"
                  value={counts.active}
                  total={counts.all}
                  color="#4c89f6"
                />
                <LoadStatRow
                  label="Dispatched"
                  value={counts.dispatched}
                  total={counts.all}
                  color="#c5836c"
                />
                <LoadStatRow
                  label="Cancelled"
                  value={counts.cancelled}
                  total={counts.all}
                  color="#e26763"
                />
              </div>
            </section>

            <section className="fp-load-side-card">
              <div className="flex items-center justify-between">
                <h2>Top Lanes</h2>
                <span className="text-[8px] font-[600] text-[#16853B]">
                  View All →
                </span>
              </div>

              <div className="fp-top-lanes mt-3">
                {topLanes.length > 0 ? (
                  topLanes.map(([route, count], index) => (
                    <div key={route} className="fp-top-lane-row">
                      <span className="fp-lane-rank">{index + 1}</span>
                      <span className="min-w-0 flex-1 truncate">{route}</span>
                      <span>{count} {count === 1 ? "load" : "loads"}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-[9px] text-[#8192a6]">
                    No lane history yet.
                  </div>
                )}
              </div>
            </section>

            <div className="fp-load-promo">
              <div className="absolute inset-0 bg-gradient-to-r from-[#102238]/80 via-[#102238]/28 to-transparent" />
              <div className="relative z-10">
                <div className="text-[15px] font-[700] leading-[1.15] text-white">
                  Every mile<br />builds your tomorrow.
                </div>
                <div className="mt-4 h-[3px] w-10 bg-[#16853B]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}




function DateCell({ value }: { value?: string | null }) {
  if (!value) return <span>—</span>;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return (
    <div className="leading-[1.25]">
      <div>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
      <div className="mt-[2px] text-[7px] text-[#8192a6]">08:00</div>
    </div>
  );
}

function LoadDonut({
  counts,
}: {
  counts: {
    all: number;
    active: number;
    completed: number;
    dispatched: number;
    cancelled: number;
    expired: number;
  };
}) {
  const total = Math.max(1, counts.all);

  const items = [
    { label: "Completed", value: counts.completed, color: "#58c98a" },
    { label: "Active", value: counts.active, color: "#16853B" },
    { label: "Dispatched", value: counts.dispatched, color: "#b8836c" },
    { label: "Cancelled", value: counts.cancelled, color: "#e16e69" },
  ];

  let cursor = 0;
  const stops = items.map((item) => {
    const share = (item.value / total) * 100;
    const from = cursor;
    const to = cursor + share;
    cursor = to;
    return `${item.color} ${from}% ${to}%`;
  });

  if (cursor < 100) {
    stops.push(`#e9eef4 ${cursor}% 100%`);
  }

  const background =
    counts.all > 0
      ? `conic-gradient(${stops.join(", ")})`
      : "conic-gradient(#e9eef4 0 100%)";

  return (
    <div className="fp-load-chart-shell">
      <div
        className="fp-load-donut"
        style={{ background }}
      >
        <div className="fp-load-donut-center">
          <strong>{counts.all}</strong>
          <span>Total Loads</span>
        </div>
      </div>

      <div className="fp-load-donut-caption">
        <span className="fp-load-donut-dot" />
        <span>Live load mix</span>
      </div>
    </div>
  );
}

function LoadStatRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="fp-load-stat-row">
      <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span>
      <strong>{value}</strong>
      <span>{pct}%</span>
    </div>
  );
}

function PageLink({
  href,
  children,
  active = false,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return <span className="fp-page-button disabled">{children}</span>;
  }
  return (
    <Link
      href={href}
      className={`fp-page-button ${active ? "active" : ""}`}
    >
      {children}
    </Link>
  );
}

function statusHref(baseQuery: URLSearchParams, status: string) {
  const params = new URLSearchParams(baseQuery);
  if (status === "all") params.delete("status");
  else params.set("status", status);
  params.delete("page");
  return `/loads${params.toString() ? `?${params}` : ""}`;
}

function pageHref(baseQuery: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseQuery);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return `/loads${params.toString() ? `?${params}` : ""}`;
}

function normalizedStatus(value?: string | null) {
  return normalizeLoadStatus(value);
}

function isActive(value?: string | null) {
  return ["UPCOMING", "IN TRANSIT", "ACTIVE"].includes(normalizedStatus(value));
}

function isCompleted(value?: string | null) {
  return ["COMPLETED", "DELIVERED"].includes(normalizedStatus(value));
}

function displayStatus(value?: string | null) {
  const status = normalizedStatus(value);
  return status
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function tone(
  value?: string | null
): "blue" | "green" | "red" | "orange" | "gray" {
  const status = normalizedStatus(value);
  if (isCompleted(status)) return "green";
  if (status === "CANCELLED") return "red";
  if (status === "IN TRANSIT" || status === "DISPATCHED") return "blue";
  return "gray";
}

function compactLocation(value?: string | null) {
  if (!value) return "—";

  const normalized = normalizeUsLocation(value);
  if (normalized.ok) return normalized.value;

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const city = (parts[0] || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase());
  const state = (parts[1] || "").toUpperCase();

  return [city, state].filter(Boolean).join(", ") || "—";
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  return new Date(`${value.slice(0, 10)}T12:00:00`).getTime();
}

function loadInDateWindow(
  load: Load,
  start: Date | null,
  end: Date | null
) {
  const pickup = parseDate(load.pickup_date);
  if (!pickup) return false;
  if (start && pickup.getTime() < start.getTime()) return false;
  if (end && pickup.getTime() > end.getTime()) return false;
  return true;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function customRangeLabel(from?: string, to?: string) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);

  if (fromDate && toDate) {
    return `${formatShortDate(fromDate)} – ${formatShortDate(toDate)}`;
  }
  if (fromDate) return `From ${formatShortDate(fromDate)}`;
  if (toDate) return `Through ${formatShortDate(toDate)}`;
  return "Custom Range";
}

function metricChange(
  current: number,
  previous: number | undefined,
  comparisonLabel: string,
  period: string,
  periodLabel: string
) {
  if (period === "all") {
    return {
      change: "— Lifetime",
      note: "all recorded loads",
    };
  }

  if (period === "custom") {
    return {
      change: "— Custom",
      note: periodLabel,
    };
  }

  if (previous == null) {
    return {
      change: "—",
      note: comparisonLabel,
    };
  }

  if (previous === 0) {
    return {
      change: current === 0 ? "→ 0%" : "↑ New",
      note: comparisonLabel,
    };
  }

  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = pct > 0.05 ? "↑" : pct < -0.05 ? "↓" : "→";

  return {
    change: `${arrow} ${formatPercent(Math.abs(pct))}`,
    note: comparisonLabel,
  };
}

function numberParam(value?: string) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number) {
  return formatMoney(value);
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 9h16" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function PlusIcon() {
  return <span className="text-[17px] font-[400]">＋</span>;
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M12 3v12M8 7l4-4 4 4M5 15v5h14v-5" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8">
      <path d="M12 3v12M8 11l4 4 4-4M5 19h14" />
    </svg>
  );
}
