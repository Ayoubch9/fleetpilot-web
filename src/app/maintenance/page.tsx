import Link from "next/link";
import AppShell from "@/components/app-shell";
import { EmptyState, StatusBadge } from "@/components/fleet-ui";
import { getFleetPilotAccount } from "@/lib/fleetpilot-account";
import { num, parseDate, money } from "@/lib/fleetpilot-week";
import AddMaintenanceForm from "./add-maintenance-form";

type Truck = {
  id: string;
  unit_number: string;
  current_mileage: number | string | null;
  status: string | null;
};

type Maintenance = {
  id: string;
  truck_id: string | null;
  service_type: string | null;
  service_date: string | null;
  mileage: number | string | null;
  vendor: string | null;
  cost: number | string | null;
  next_service_mileage: number | string | null;
  next_service_date: string | null;
  expense_id: string | null;
};

type Params = {
  q?: string;
  state?: string;
  truck?: string;
  service?: string;
  sort?: string;
  page?: string;
};

const PAGE_SIZE = 10;

function active(status?: string | null) {
  return !["INACTIVE", "PARKED", "OUT OF SERVICE", "OUT"].includes(
    (status || "").toUpperCase()
  );
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const stateFilter = (params.state || "all").toLowerCase();
  const truckFilter = params.truck || "all";
  const serviceFilter = (params.service || "all").toLowerCase();
  const sort = (params.sort || "newest").toLowerCase();
  const requestedPage = Math.max(1, Number(params.page || "1") || 1);

  const { supabase, fullName, companyName, role } =
    await getFleetPilotAccount();

  const [
    { data: truckData, error: truckError },
    { data: maintenanceData, error },
  ] = await Promise.all([
    supabase
      .from("trucks")
      .select("id, unit_number, current_mileage, status")
      .order("unit_number"),
    supabase
      .from("maintenance_records")
      .select("*")
      .order("service_date", { ascending: false }),
  ]);

  const allTrucks = (truckData ?? []) as Truck[];
  const trucks = allTrucks.filter((truck) => active(truck.status));
  const records = (maintenanceData ?? []) as Maintenance[];
  const truckMap = new Map(allTrucks.map((truck) => [truck.id, truck]));

  const today = new Date();
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const state = (record: Maintenance) => {
    const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
    const nextMileage =
      record.next_service_mileage == null
        ? null
        : num(record.next_service_mileage);
    const milesLeft =
      nextMileage == null || !truck
        ? null
        : nextMileage - num(truck.current_mileage);
    const nextDate = parseDate(record.next_service_date);

    const overdue =
      (milesLeft != null && milesLeft <= 0) ||
      (nextDate ? nextDate.getTime() <= day.getTime() : false);

    const upcoming =
      (milesLeft != null && milesLeft > 0 && milesLeft <= 3500) ||
      (nextDate
        ? nextDate.getTime() <= day.getTime() + 30 * 86400000
        : false);

    return overdue ? "Overdue" : upcoming ? "Upcoming" : "Completed";
  };

  const completed = records.filter((record) => state(record) === "Completed").length;
  const upcoming = records.filter((record) => state(record) === "Upcoming").length;
  const overdue = records.filter((record) => state(record) === "Overdue").length;

  const serviceTypes = [...new Set(
    records
      .map((record) => (record.service_type || "").trim())
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  let filtered = records.filter((record) => {
    if (!q) return true;
    const truck = record.truck_id ? truckMap.get(record.truck_id) : null;
    return [
      record.service_type,
      record.vendor,
      truck?.unit_number,
      state(record),
    ].some((value) => (value || "").toLowerCase().includes(q));
  });

  if (stateFilter !== "all") {
    filtered = filtered.filter(
      (record) => state(record).toLowerCase() === stateFilter
    );
  }

  if (truckFilter !== "all") {
    filtered = filtered.filter((record) => record.truck_id === truckFilter);
  }

  if (serviceFilter !== "all") {
    filtered = filtered.filter(
      (record) => (record.service_type || "").toLowerCase() === serviceFilter
    );
  }

  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") return dateValue(a.service_date) - dateValue(b.service_date);
    if (sort === "mileage") return num(b.mileage) - num(a.mileage);
    return dateValue(b.service_date) - dateValue(a.service_date);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const upcomingServices = records
    .filter((record) => ["Upcoming", "Overdue"].includes(state(record)))
    .sort((a, b) => {
      const ad = dateValue(a.next_service_date);
      const bd = dateValue(b.next_service_date);
      if (!ad) return 1;
      if (!bd) return -1;
      return ad - bd;
    })
    .slice(0, 4);

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (stateFilter !== "all") query.set("state", stateFilter);
  if (truckFilter !== "all") query.set("truck", truckFilter);
  if (serviceFilter !== "all") query.set("service", serviceFilter);
  if (sort !== "newest") query.set("sort", sort);

  return (
    <AppShell
      active="maintenance"
      fullName={fullName}
      companyName={companyName}
      role={role}
    >
      <div className="fp-maint-page">
        <section className="fp-maint-heading">
          <div>
            <h1 className="fp-maint-title">Maintenance</h1>
            <p className="fp-maint-subtitle">
              Track and schedule maintenance to keep your fleet safe and on the road.
            </p>
          </div>

          <div id="add-maintenance">
            <AddMaintenanceForm trucks={trucks} />
          </div>
        </section>

        {(error || truckError) && (
          <div className="mt-3 rounded-[10px] border border-[#ffcf82] bg-[#fff7e8] px-4 py-3 text-[10px] font-[600] text-[#966217]">
            {(error || truckError)?.message}
          </div>
        )}

        <div className="fp-maint-layout mt-4">
          <div className="min-w-0">
            <div className="fp-maint-kpi-grid">
              <MaintKpi label="Total Services" value={records.length} tone="blue" icon="service" note="↑ 20% vs last month" />
              <MaintKpi label="Completed" value={completed} tone="green" icon="completed" note="↑ 28% vs last month" />
              <MaintKpi label="Upcoming" value={upcoming} tone="blue" icon="calendar" note="— current schedule" />
            </div>

            <section className="fp-maint-table-card mt-4">
              <div className="fp-maint-tabs">
                <MaintTab href={tabHref("all", q, truckFilter, serviceFilter, sort)} label="All Services" count={records.length} active={stateFilter === "all"} />
                <MaintTab href={tabHref("upcoming", q, truckFilter, serviceFilter, sort)} label="Upcoming" count={upcoming} active={stateFilter === "upcoming"} />
                <MaintTab href={tabHref("overdue", q, truckFilter, serviceFilter, sort)} label="Overdue" count={overdue} active={stateFilter === "overdue"} />
                <MaintTab href={tabHref("completed", q, truckFilter, serviceFilter, sort)} label="Completed" count={completed} active={stateFilter === "completed"} />
              </div>

              <form action="/maintenance" className="fp-maint-filterbar">
                <label className="fp-maint-search">
                  <SearchIcon />
                  <input name="q" defaultValue={params.q || ""} placeholder="Search by truck, service type, vendor..." />
                </label>

                <select name="service" defaultValue={serviceFilter} className="fp-maint-filter-select">
                  <option value="all">Service Type</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
                  ))}
                </select>

                <select name="truck" defaultValue={truckFilter} className="fp-maint-filter-select">
                  <option value="all">Truck</option>
                  {allTrucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>Truck #{truck.unit_number}</option>
                  ))}
                </select>

                <select name="state" defaultValue={stateFilter} className="fp-maint-filter-select">
                  <option value="all">Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </select>

                <button type="submit" className="fp-maint-filter-button">
                  <FilterIcon /> More Filters
                </button>

                <div className="fp-maint-sort">
                  <span>Sort by</span>
                  <select name="sort" defaultValue={sort}>
                    <option value="newest">Date (Newest)</option>
                    <option value="oldest">Date (Oldest)</option>
                    <option value="mileage">Mileage (Highest)</option>
                  </select>
                </div>
              </form>

              <div className="fp-maint-table-wrap">
                <table className="fp-maint-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Service Type</th>
                      <th>Vendor</th>
                      <th>Truck</th>
                      <th>Mileage</th>
                      <th>Status</th>
                      <th>Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((record, index) => {
                      const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
                      const status = state(record);
                      return (
                        <tr key={record.id}>
                          <td className="fp-maint-number">
                            #{String((page - 1) * PAGE_SIZE + index + 1).padStart(4, "0")}
                          </td>
                          <td>{shortDate(record.service_date)}</td>
                          <td className="fp-maint-type">{record.service_type || "Service"}</td>
                          <td>{record.vendor || "—"}</td>
                          <td className="font-[650]">#{truck?.unit_number || "—"}</td>
                          <td>{num(record.mileage) > 0 ? `${num(record.mileage).toLocaleString()} mi` : "—"}</td>
                          <td>
                            <StatusBadge tone={status === "Overdue" ? "red" : status === "Upcoming" ? "blue" : "green"}>
                              {status}
                            </StatusBadge>
                          </td>
                          <td className={status === "Overdue" ? "text-[#e5525b]" : ""}>
                            {nextDue(record)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pageRecords.length === 0 && <EmptyState text="No maintenance records match these filters." />}
              </div>

              <div className="fp-maint-pagination">
                <span>
                  Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} services
                </span>
                <div className="flex items-center gap-1.5">
                  <PageLink href={pageHref(query, Math.max(1, page - 1))} disabled={page === 1}>‹</PageLink>
                  <PageLink href={pageHref(query, page)} active>{page}</PageLink>
                  <PageLink href={pageHref(query, Math.min(pageCount, page + 1))} disabled={page === pageCount}>›</PageLink>
                  <span className="fp-maint-page-size">10 per page⌄</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="fp-maint-right-rail">
            <section className="fp-maint-side-card">
              <h2>Quick Actions</h2>
              <div className="mt-3 grid gap-2">
                <Link href="/maintenance#add-maintenance" className="fp-maint-side-action primary">
                  <span className="fp-maint-side-icon"><ToolIcon /></span>
                  <span>Add Maintenance</span><span>›</span>
                </Link>
                <Link href="/maintenance#add-maintenance" className="fp-maint-side-action">
                  <span className="fp-maint-side-icon"><CalendarIcon /></span>
                  <span>Schedule Service</span><span>›</span>
                </Link>
                <Link href="/maintenance?state=completed" className="fp-maint-side-action">
                  <span className="fp-maint-side-icon"><HistoryIcon /></span>
                  <span>Service History</span><span>›</span>
                </Link>
                <Link href="/maintenance?state=overdue" className="fp-maint-side-action">
                  <span className="fp-maint-side-icon"><AlertIcon /></span>
                  <span>View Overdue</span><span>›</span>
                </Link>
              </div>
            </section>

            <section className="fp-maint-side-card">
              <h2>Maintenance Status</h2>
              <div className="mt-4 flex justify-center">
                <MaintDonut total={records.length} completed={completed} upcoming={upcoming} overdue={overdue} />
              </div>
              <div className="fp-maint-stat-list mt-4">
                <MaintStatRow label="Completed" value={completed} total={records.length} color="#58bd69" />
                <MaintStatRow label="Upcoming" value={upcoming} total={records.length} color="#4f8df7" />
                <MaintStatRow label="Overdue" value={overdue} total={records.length} color="#ef5755" />
              </div>
            </section>

            <section className="fp-maint-side-card">
              <div className="flex items-center justify-between">
                <h2>Upcoming Services</h2>
                <span className="text-[9px] font-[600] text-[#1188ff]">View All →</span>
              </div>
              <div className="fp-maint-upcoming-list mt-3">
                {upcomingServices.length > 0 ? upcomingServices.map((record) => {
                  const truck = record.truck_id ? truckMap.get(record.truck_id) : undefined;
                  return (
                    <div key={record.id} className="fp-maint-upcoming-row">
                      <span className="fp-maint-upcoming-icon"><CalendarIcon /></span>
                      <div className="min-w-0">
                        <div className="truncate">#{truck?.unit_number || "—"} · {record.service_type || "Service"}</div>
                        <span>{nextDue(record)}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-4 text-[9px] text-[#8192a6]">No upcoming service items.</div>
                )}
              </div>
            </section>

            <div className="fp-maint-promo">
              <div className="absolute inset-0 bg-gradient-to-r from-[#06182d]/82 via-[#06182d]/28 to-transparent" />
              <div className="relative z-10">
                <div className="text-[16px] font-[740] leading-[1.18] text-white">
                  Prevent Problems.<br />Drive Further.
                </div>
                <div className="mt-1 text-[10px] text-white/80">Drive Further.</div>
                <div className="mt-4 h-[3px] w-10 bg-[#4c98ff]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function MaintKpi({ label, value, tone, icon, note }: {
  label: string;
  value: number;
  tone: "blue" | "green";
  icon: "service" | "completed" | "calendar";
  note: string;
}) {
  const palette = {
    blue: { color: "#4b8df6", soft: "#eaf3ff" },
    green: { color: "#55a965", soft: "#e9f7ed" },
  }[tone];
  return (
    <div className="fp-maint-kpi">
      <div className="fp-maint-kpi-icon" style={{ color: palette.color, backgroundColor: palette.soft }}>
        <MaintKpiIcon type={icon} />
      </div>
      <div>
        <div className="fp-maint-kpi-label">{label}</div>
        <div className="fp-number fp-maint-kpi-value">{value}</div>
        <div className="fp-maint-kpi-note">{note}</div>
      </div>
    </div>
  );
}

function MaintKpiIcon({ type }: { type: "service" | "completed" | "calendar" }) {
  if (type === "completed") return <CheckIcon />;
  if (type === "calendar") return <CalendarIcon />;
  return <ToolIcon />;
}

function MaintTab({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return (
    <Link href={href} className={`fp-maint-tab ${active ? "active" : ""}`}>
      <span>{label}</span><span className="fp-maint-tab-count">{count}</span>
    </Link>
  );
}

function MaintDonut({ total, completed, upcoming, overdue }: { total: number; completed: number; upcoming: number; overdue: number }) {
  const safe = Math.max(1, total);
  const c = (completed / safe) * 100;
  const u = (upcoming / safe) * 100;
  const o = (overdue / safe) * 100;
  const s2 = c + u;
  const s3 = Math.min(100, s2 + o);
  const background = total > 0
    ? `conic-gradient(#58bd69 0 ${c}%, #4f8df7 ${c}% ${s2}%, #ef5755 ${s2}% ${s3}%, #e7edf3 ${s3}% 100%)`
    : "conic-gradient(#e7edf3 0 100%)";
  return (
    <div className="fp-maint-donut" style={{ background }}>
      <div><strong>{total}</strong><span>Total Services</span></div>
    </div>
  );
}

function MaintStatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="fp-maint-stat-row">
      <span className="h-[9px] w-[9px] rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1">{label}</span><strong>{value}</strong><span>{pct}%</span>
    </div>
  );
}

function nextDue(record: Maintenance) {
  if (record.next_service_date) return shortDate(record.next_service_date);
  if (record.next_service_mileage) return `${num(record.next_service_mileage).toLocaleString()} mi`;
  return "—";
}

function tabHref(state: string, q: string, truck: string, service: string, sort: string) {
  const params = new URLSearchParams();
  if (state !== "all") params.set("state", state);
  if (q) params.set("q", q);
  if (truck !== "all") params.set("truck", truck);
  if (service !== "all") params.set("service", service);
  if (sort !== "newest") params.set("sort", sort);
  return `/maintenance${params.toString() ? `?${params}` : ""}`;
}

function pageHref(base: URLSearchParams, page: number) {
  const params = new URLSearchParams(base);
  if (page > 1) params.set("page", String(page)); else params.delete("page");
  return `/maintenance${params.toString() ? `?${params}` : ""}`;
}

function PageLink({ href, children, active = false, disabled = false }: {
  href: string; children: React.ReactNode; active?: boolean; disabled?: boolean;
}) {
  if (disabled) return <span className="fp-maint-page-button disabled">{children}</span>;
  return <Link href={href} className={`fp-maint-page-button ${active ? "active" : ""}`}>{children}</Link>;
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  return new Date(`${value.slice(0,10)}T12:00:00`).getTime();
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-none stroke-current" strokeWidth="1.8"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
}
function FilterIcon() {
  return <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] fill-none stroke-current" strokeWidth="1.8"><path d="M4 6h16M7 12h10M10 18h4"/></svg>;
}
function ToolIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="M14.5 6a4 4 0 0 0-5 5L4 16.5 7.5 20l5.5-5.5a4 4 0 0 0 5-5L15.5 12 12 8.5 14.5 6Z"/></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="m8 12 2.5 2.5L16 9"/></svg>;
}
function CalendarIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg>;
}
function HistoryIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h8"/></svg>;
}
function AlertIcon() {
  return <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] fill-none stroke-current" strokeWidth="1.8"><path d="m12 3 9 16H3L12 3Z"/><path d="M12 9v4M12 16h.01"/></svg>;
}
