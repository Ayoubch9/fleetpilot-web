import Link from "next/link";
import AppShell from "@/components/app-shell";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import AddLoadForm from "./add-load-form";
import LoadActions from "./load-actions";

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
};

type Params = {
  q?: string;
  status?: string;
  page?: string;
  sort?: string;
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
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);

  const { supabase, fullName, companyName, role } =
    await getFleetPilotAccount();

  const [
    { data: loadData, error: loadError },
    { data: truckData, error: truckError },
    { data: expenseData, error: expenseError },
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
    supabase.from("expenses").select("load_id, amount"),
  ]);

  const allLoads = (loadData ?? []) as Load[];
  const trucks = ((truckData ?? []) as Truck[]).filter(
    (truck) => (truck.status || "").toUpperCase() !== "INACTIVE"
  );
  const expenses = (expenseData ?? []) as Expense[];

  const directExpenseByLoad = new Map<string, number>();
  for (const expense of expenses) {
    if (!expense.load_id) continue;
    directExpenseByLoad.set(
      expense.load_id,
      (directExpenseByLoad.get(expense.load_id) || 0) +
        numberValue(expense.amount)
    );
  }

  const loadProfit = (load: Load) =>
    numberValue(load.rate) - (directExpenseByLoad.get(load.id) || 0);

  const counts = {
    all: allLoads.length,
    active: allLoads.filter((load) => isActive(load.status)).length,
    completed: allLoads.filter((load) => isCompleted(load.status)).length,
    dispatched: allLoads.filter(
      (load) => normalizedStatus(load.status) === "DISPATCHED"
    ).length,
    cancelled: allLoads.filter(
      (load) => normalizedStatus(load.status) === "CANCELLED"
    ).length,
  };

  const totalRevenue = allLoads.reduce(
    (sum, load) => sum + numberValue(load.rate),
    0
  );
  const totalProfit = allLoads.reduce(
    (sum, load) => sum + loadProfit(load),
    0
  );
  const avgProfit = allLoads.length > 0 ? totalProfit / allLoads.length : 0;

  let filteredLoads = allLoads.filter((load) => {
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
      if (filter === "completed") return isCompleted(status);
      if (filter === "dispatched") return status === "DISPATCHED";
      if (filter === "cancelled") return status === "CANCELLED";
      return true;
    });
  }

  filteredLoads = [...filteredLoads].sort((a, b) => {
    if (sort === "oldest") {
      return dateValue(a.pickup_date) - dateValue(b.pickup_date);
    }
    if (sort === "rate") {
      return numberValue(b.rate) - numberValue(a.rate);
    }
    if (sort === "profit") {
      return loadProfit(b) - loadProfit(a);
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
  for (const load of allLoads) {
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

  const errors = [loadError, truckError, expenseError].filter(Boolean);

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

          <div id="add-load">
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
            <div className="fp-load-kpi-grid">
              <LoadKpi
                label="Total Loads"
                value={`${counts.all}`}
                change="↑ 20%"
                note="vs last month"
                tone="blue"
                icon="truck"
              />
              <LoadKpi
                label="Total Revenue"
                value={money(totalRevenue)}
                change="↑ 18%"
                note="vs last month"
                tone="green"
                icon="money"
              />
              <LoadKpi
                label="Total Profit"
                value={money(totalProfit)}
                change="↑ 24%"
                note="vs last month"
                tone="purple"
                icon="profit"
              />
              <LoadKpi
                label="Avg. Profit per Load"
                value={money(avgProfit)}
                change="↑ 12%"
                note="vs last month"
                tone="blue"
                icon="pie"
              />
            </div>

            <section className="fp-loads-table-card mt-4">
              <div className="fp-load-tabs">
                <LoadTab
                  href={filterHref("all", q, sort)}
                  label="All Loads"
                  count={counts.all}
                  active={filter === "all"}
                />
                <LoadTab
                  href={filterHref("active", q, sort)}
                  label="Active"
                  count={counts.active}
                  active={filter === "active"}
                />
                <LoadTab
                  href={filterHref("completed", q, sort)}
                  label="Completed"
                  count={counts.completed}
                  active={filter === "completed"}
                />
                <LoadTab
                  href={filterHref("dispatched", q, sort)}
                  label="Dispatched"
                  count={counts.dispatched}
                  active={filter === "dispatched"}
                />
                <LoadTab
                  href={filterHref("cancelled", q, sort)}
                  label="Cancelled"
                  count={counts.cancelled}
                  active={filter === "cancelled"}
                />
              </div>

              <form action="/loads" className="fp-load-filterbar">
                {filter !== "all" && (
                  <input type="hidden" name="status" value={filter} />
                )}

                <label className="fp-load-search">
                  <SearchIcon />
                  <input
                    name="q"
                    defaultValue={params.q || ""}
                    placeholder="Search by load #, broker, origin, destination..."
                  />
                </label>

                <button type="button" className="fp-filter-button">
                  <CalendarIcon />
                  Date Range
                  <span>⌄</span>
                </button>

                <select
                  name="status"
                  defaultValue={filter}
                  className="fp-filter-select"
                >
                  <option value="all">Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button type="submit" className="fp-filter-button">
                  <FilterIcon />
                  More Filters
                </button>

                <div className="fp-load-sort">
                  <span>Sort by</span>
                  <select name="sort" defaultValue={sort}>
                    <option value="newest">Pickup Date (Newest)</option>
                    <option value="oldest">Pickup Date (Oldest)</option>
                    <option value="rate">Highest Revenue</option>
                    <option value="profit">Highest Profit</option>
                  </select>
                </div>
              </form>

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
                      const miles =
                        numberValue(load.loaded_miles) +
                        numberValue(load.deadhead_miles);
                      const rate = numberValue(load.rate);
                      const profit = loadProfit(load);

                      return (
                        <tr key={load.id}>
                          <td className="fp-load-number">
                            #{load.load_number || "—"}
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
                          <td>{miles.toLocaleString()}</td>
                          <td className="fp-load-rate">{money(rate)}</td>
                          <td
                            className={
                              profit >= 0
                                ? "fp-load-profit-positive"
                                : "fp-load-profit-negative"
                            }
                          >
                            {money(profit)}
                          </td>
                          <td>
                            <StatusBadge tone={tone(load.status)}>
                              {displayStatus(load.status)}
                            </StatusBadge>
                          </td>
                          <td className="fp-load-actions-cell">
                            <LoadActions id={load.id} status={load.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {pageLoads.length === 0 && (
                  <EmptyState text="No loads match these filters." />
                )}
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
              <div className="mt-3 grid gap-2">
                <Link href="/loads#add-load" className="fp-load-side-action primary">
                  <span className="fp-load-side-icon">
                    <PlusIcon />
                  </span>
                  <span>Add Load</span>
                  <span>›</span>
                </Link>

                <Link href="/loads#add-load" className="fp-load-side-action">
                  <span className="fp-load-side-icon">
                    <ImportIcon />
                  </span>
                  <span>Import from Broker</span>
                  <span>›</span>
                </Link>

                <button className="fp-load-side-action">
                  <span className="fp-load-side-icon">
                    <DuplicateIcon />
                  </span>
                  <span>Duplicate Load</span>
                  <span>›</span>
                </button>

                <button className="fp-load-side-action">
                  <span className="fp-load-side-icon">
                    <ExportIcon />
                  </span>
                  <span>Export Loads</span>
                  <span>›</span>
                </button>
              </div>
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
                <span className="text-[8px] font-[600] text-[#1188ff]">
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
              <div className="absolute inset-0 bg-gradient-to-r from-[#07172a]/80 via-[#07172a]/28 to-transparent" />
              <div className="relative z-10">
                <div className="text-[15px] font-[740] leading-[1.15] text-white">
                  Every mile<br />builds your tomorrow.
                </div>
                <div className="mt-4 h-[3px] w-10 bg-[#4c98ff]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function LoadKpi({
  label,
  value,
  change,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  note: string;
  tone: "blue" | "green" | "purple";
  icon: "truck" | "money" | "profit" | "pie";
}) {
  const palette = {
    blue: { color: "#4b8df6", soft: "#eaf3ff" },
    green: { color: "#42aa63", soft: "#e9f7ee" },
    purple: { color: "#7b5be7", soft: "#f0ecff" },
  }[tone];

  return (
    <div className="fp-load-kpi">
      <div
        className="fp-load-kpi-icon"
        style={{ color: palette.color, backgroundColor: palette.soft }}
      >
        <LoadKpiIcon type={icon} />
      </div>

      <div className="min-w-0">
        <div className="fp-load-kpi-label">{label}</div>
        <div className="fp-load-kpi-value fp-number">{value}</div>
        <div className="fp-load-kpi-change">{change}</div>
        <div className="fp-load-kpi-note">{note}</div>
      </div>

    </div>
  );
}

function LoadKpiIcon({
  type,
}: {
  type: "truck" | "money" | "profit" | "pie";
}) {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[17px] w-[17px] fill-none stroke-current",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (type === "truck") {
    return (
      <svg {...common}>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    );
  }

  if (type === "money") {
    return <span className="text-[18px] font-[760]">$</span>;
  }

  if (type === "profit") {
    return (
      <svg {...common}>
        <path d="M5 19V11M10 19V7M15 19V13M20 19V4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 3v9h9A9 9 0 1 1 12 3Z" />
      <path d="M15 3.6A9 9 0 0 1 20.4 9H15Z" />
    </svg>
  );
}

function LoadTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`fp-load-tab ${active ? "active" : ""}`}
    >
      <span>{label}</span>
      <span className="fp-load-tab-count">{count}</span>
    </Link>
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
  };
}) {
  const total = Math.max(1, counts.all);

  const items = [
    { label: "Completed", value: counts.completed, color: "#58c98a" },
    { label: "Active", value: counts.active, color: "#4f8df7" },
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

function filterHref(status: string, q: string, sort: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  if (sort !== "newest") params.set("sort", sort);
  return `/loads${params.toString() ? `?${params}` : ""}`;
}

function pageHref(baseQuery: URLSearchParams, page: number) {
  const params = new URLSearchParams(baseQuery);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return `/loads${params.toString() ? `?${params}` : ""}`;
}

function normalizedStatus(value?: string | null) {
  return (value || "UPCOMING").trim().toUpperCase();
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
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.slice(0, 2).join(", ");
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  return new Date(`${value.slice(0, 10)}T12:00:00`).getTime();
}

function numberValue(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
